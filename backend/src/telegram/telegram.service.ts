import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { employeeBranchObjectId } from '../common/utils/branch-scope.util';
import { ProductStatus } from '../common/enums/product.enums';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateTelegramChannelDto } from './dto/create-telegram-channel.dto';
import { UpdateTelegramChannelDto } from './dto/update-telegram-channel.dto';
import { TelegramApiService } from './telegram-api.service';
import {
  TelegramChannel,
  TelegramChannelDocument,
} from './schemas/telegram-channel.schema';
import {
  TelegramPublication,
  TelegramPublicationDocument,
  TelegramPublicationStatus,
} from './schemas/telegram-publication.schema';

@Injectable()
export class TelegramService {
  constructor(
    @InjectModel(TelegramChannel.name)
    private readonly channelModel: Model<TelegramChannelDocument>,
    @InjectModel(TelegramPublication.name)
    private readonly publicationModel: Model<TelegramPublicationDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    private readonly telegramApi: TelegramApiService,
    private readonly config: ConfigService,
  ) {}

  async getHub(user: AuthUser) {
    const [botInfo, channels, products, publications] = await Promise.all([
      this.telegramApi.getMe(),
      this.channelModel.find().sort({ name: 1 }).lean(),
      this.loadScopedProducts(user),
      this.publicationModel.find().lean(),
    ]);

    const pubByProduct = new Map<string, typeof publications>();
    for (const pub of publications) {
      const key = String(pub.product);
      const list = pubByProduct.get(key) ?? [];
      list.push(pub);
      pubByProduct.set(key, list);
    }

    const channelMap = new Map(channels.map((c) => [String(c._id), c]));

    const items = products.map((product) => {
      const pubs = (pubByProduct.get(String(product._id)) ?? []).map((pub) => {
        const ch = channelMap.get(String(pub.channel));
        return {
          id: String(pub._id),
          channelId: String(pub.channel),
          channelName: ch?.name ?? 'Канал',
          status: pub.status,
          messageId: pub.messageId,
          postUrl: pub.postUrl,
          lastSyncAt: pub.lastSyncAt,
          errorMessage: pub.errorMessage,
        };
      });

      const branch = product.branch as unknown as { name?: string };
      const publishedCount = pubs.filter(
        (p) => p.status === TelegramPublicationStatus.PUBLISHED,
      ).length;

      return {
        productId: String(product._id),
        name: product.name,
        price: product.price,
        category: product.category,
        productStatus: product.status,
        photo: product.photos?.[0],
        branchName: branch?.name,
        publications: pubs,
        summaryStatus: this.summarizeProductStatus(pubs, publishedCount),
      };
    });

    const stats = {
      published: items.filter((i) => i.summaryStatus === 'published').length,
      errors: items.filter((i) => i.summaryStatus === 'error').length,
      notPublished: items.filter((i) => i.summaryStatus === 'not_published')
        .length,
      total: items.length,
    };

    return {
      bot: {
        configured: this.telegramApi.isConfigured,
        connected: Boolean(botInfo),
        username: botInfo?.username,
        name: botInfo?.first_name,
      },
      channels: channels.map((c) => ({
        id: String(c._id),
        name: c.name,
        chatId: c.chatId,
        username: c.username,
        description: c.description,
        isActive: c.isActive,
      })),
      stats,
      items,
    };
  }

  async listChannels() {
    const channels = await this.channelModel.find().sort({ name: 1 }).lean();
    return {
      channels: channels.map((c) => ({
        id: String(c._id),
        name: c.name,
        chatId: c.chatId,
        username: c.username,
        description: c.description,
        isActive: c.isActive,
      })),
    };
  }

  async createChannel(dto: CreateTelegramChannelDto) {
    if (!this.telegramApi.isConfigured) {
      throw new BadRequestException('TELEGRAM_BOT_TOKEN не настроен на сервере');
    }

    const chatId = dto.chatId.trim();
    const chat = await this.telegramApi.getChat(chatId);
    if (!chat) {
      throw new BadRequestException(
        'Канал не найден. Добавьте бота администратором канала и укажите @username или числовой chat_id',
      );
    }

    try {
      const channel = await this.channelModel.create({
        ...dto,
        chatId,
        username: dto.username?.trim() || chat.username,
        name: dto.name.trim() || chat.title || chatId,
      });
      return { channel: this.mapChannel(channel) };
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === 11000
      ) {
        throw new ConflictException('Канал с таким chat_id уже добавлен');
      }
      throw err;
    }
  }

  async updateChannel(id: string, dto: UpdateTelegramChannelDto) {
    const channel = await this.channelModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!channel) throw new NotFoundException('Канал не найден');
    return { channel: this.mapChannel(channel) };
  }

  async removeChannel(id: string) {
    const pubCount = await this.publicationModel.countDocuments({
      channel: new Types.ObjectId(id),
      status: TelegramPublicationStatus.PUBLISHED,
    });
    if (pubCount > 0) {
      throw new ConflictException(
        'Сначала снимите опубликованные товары с этого канала',
      );
    }
    const channel = await this.channelModel.findByIdAndDelete(id).exec();
    if (!channel) throw new NotFoundException('Канал не найден');
    await this.publicationModel.deleteMany({ channel: channel._id });
    return { ok: true };
  }

  async publish(productId: string, channelId: string, user: AuthUser) {
    const product = await this.findScopedProduct(productId, user);
    if (product.status !== ProductStatus.IN_STOCK) {
      throw new BadRequestException(
        'Публиковать можно только товары «В наличии»',
      );
    }

    const channel = await this.channelModel.findById(channelId).exec();
    if (!channel || !channel.isActive) {
      throw new NotFoundException('Канал не найден или отключён');
    }

    const existing = await this.publicationModel.findOne({
      product: product._id,
      channel: channel._id,
      status: TelegramPublicationStatus.PUBLISHED,
    });
    if (existing) {
      throw new ConflictException('Товар уже опубликован в этом канале');
    }

    const branch = await this.branchModel.findById(product.branch).lean();
    const caption = this.buildCaption(product, branch);

    try {
      const message = product.photos?.[0]
        ? await this.telegramApi.sendPhoto(channel.chatId, product.photos[0], caption)
        : await this.telegramApi.sendMessage(channel.chatId, caption);

      const postUrl = this.telegramApi.buildPostUrl(
        channel.username,
        message.message_id,
      );

      const publication = await this.publicationModel.findOneAndUpdate(
        { product: product._id, channel: channel._id },
        {
          messageId: message.message_id,
          status: TelegramPublicationStatus.PUBLISHED,
          errorMessage: undefined,
          lastSyncAt: new Date(),
          postUrl,
        },
        { upsert: true, new: true },
      );

      return {
        publication: this.mapPublication(publication, channel.name),
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ошибка публикации в Telegram';

      await this.publicationModel.findOneAndUpdate(
        { product: product._id, channel: channel._id },
        {
          status: TelegramPublicationStatus.ERROR,
          errorMessage,
        },
        { upsert: true },
      );

      throw new BadRequestException(errorMessage);
    }
  }

  async unpublish(productId: string, channelId: string, user: AuthUser) {
    await this.findScopedProduct(productId, user);

    const channel = await this.channelModel.findById(channelId).exec();
    if (!channel) throw new NotFoundException('Канал не найден');

    const publication = await this.publicationModel.findOne({
      product: new Types.ObjectId(productId),
      channel: channel._id,
      status: TelegramPublicationStatus.PUBLISHED,
    });
    if (!publication) {
      throw new NotFoundException('Публикация не найдена');
    }

    try {
      await this.telegramApi.deleteMessage(channel.chatId, publication.messageId);
    } catch {
      // сообщение могло быть удалено вручную
    }

    publication.status = TelegramPublicationStatus.REMOVED;
    publication.postUrl = undefined;
    publication.lastSyncAt = new Date();
    await publication.save();

    return { ok: true };
  }

  async sync(productId: string, channelId: string, user: AuthUser) {
    const product = await this.findScopedProduct(productId, user);
    const channel = await this.channelModel.findById(channelId).exec();
    if (!channel) throw new NotFoundException('Канал не найден');

    const publication = await this.publicationModel.findOne({
      product: product._id,
      channel: channel._id,
      status: TelegramPublicationStatus.PUBLISHED,
    });
    if (!publication) {
      throw new NotFoundException('Активная публикация не найдена');
    }

    const branch = await this.branchModel.findById(product.branch).lean();
    const caption = this.buildCaption(product, branch);

    try {
      await this.telegramApi.editMessageCaption(
        channel.chatId,
        publication.messageId,
        caption,
      );
      publication.lastSyncAt = new Date();
      publication.errorMessage = undefined;
      await publication.save();
      return { ok: true, lastSyncAt: publication.lastSyncAt };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ошибка синхронизации';
      publication.status = TelegramPublicationStatus.ERROR;
      publication.errorMessage = errorMessage;
      await publication.save();
      throw new BadRequestException(errorMessage);
    }
  }

  private async loadScopedProducts(user: AuthUser) {
    const filter: Record<string, unknown> = {};
    const branchId = employeeBranchObjectId(user);
    if (branchId) filter.branch = branchId;

    return this.productModel
      .find(filter)
      .populate('branch', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  private async findScopedProduct(productId: string, user: AuthUser) {
    const filter: Record<string, unknown> = { _id: productId };
    const branchId = employeeBranchObjectId(user);
    if (branchId) filter.branch = branchId;

    const product = await this.productModel.findOne(filter).exec();
    if (!product) throw new NotFoundException('Товар не найден');
    return product;
  }

  private buildCaption(
    product: ProductDocument | (Product & { _id: Types.ObjectId }),
    branch?: { name?: string; address?: string; phone?: string } | null,
  ): string {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    const price = new Intl.NumberFormat('ru-RU').format(product.price);
    const lines = [
      `<b>${this.escapeHtml(product.name)}</b>`,
      `Категория: ${product.category}`,
      `Состояние: ${product.condition}`,
      `💰 <b>${price} ₸</b>`,
    ];

    if (product.brand) lines.push(`Бренд: ${this.escapeHtml(product.brand)}`);
    if (product.description) {
      const desc =
        product.description.length > 400
          ? `${product.description.slice(0, 397)}…`
          : product.description;
      lines.push('', this.escapeHtml(desc));
    }
    if (branch) {
      lines.push('', `📍 ${this.escapeHtml(branch.name ?? '')}`);
      if (branch.phone) lines.push(`📞 ${this.escapeHtml(branch.phone)}`);
    }
    lines.push(
      '',
      `🔗 <a href="${frontendUrl}/showcase/product/${String(product._id)}">Смотреть на витрине</a>`,
    );

    return lines.join('\n').slice(0, 1024);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private summarizeProductStatus(
    pubs: { status: TelegramPublicationStatus }[],
    publishedCount: number,
  ): 'published' | 'error' | 'not_published' {
    if (publishedCount > 0) return 'published';
    if (pubs.some((p) => p.status === TelegramPublicationStatus.ERROR)) {
      return 'error';
    }
    return 'not_published';
  }

  private mapChannel(channel: TelegramChannelDocument) {
    return {
      id: String(channel._id),
      name: channel.name,
      chatId: channel.chatId,
      username: channel.username,
      description: channel.description,
      isActive: channel.isActive,
    };
  }

  private mapPublication(
    pub: TelegramPublicationDocument,
    channelName: string,
  ) {
    return {
      id: String(pub._id),
      channelName,
      status: pub.status,
      messageId: pub.messageId,
      postUrl: pub.postUrl,
      lastSyncAt: pub.lastSyncAt,
      errorMessage: pub.errorMessage,
    };
  }
}
