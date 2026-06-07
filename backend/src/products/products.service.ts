import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema';
import {
  employeeBranchObjectId,
  getEmployeeBranchId,
} from '../common/utils/branch-scope.util';
import { ProductStatus } from '../common/enums/product.enums';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
  ) {}

  async create(dto: CreateProductDto, user?: AuthUser) {
    const branchId = getEmployeeBranchId(user) ?? dto.branch;
    await this.ensureBranchExists(branchId);

    const payload: Record<string, unknown> = {
      name: dto.name,
      category: dto.category,
      brand: dto.brand,
      description: dto.description,
      condition: dto.condition,
      price: dto.price,
      photos: dto.photos ?? [],
      branch: new Types.ObjectId(branchId),
      status: dto.status,
    };
    if (dto.model !== undefined) {
      payload['model'] = dto.model;
    }

    const product = await this.productModel.create(payload);
    return this.findById(String(product._id), user);
  }

  async findAll(query: ProductQueryDto, user?: AuthUser) {
    const filter = this.buildFilter(query, { includeAllStatuses: true });
    this.applyBranchScope(filter, user);
    return this.queryWithPagination(filter, query);
  }

  async findPublished(query: ProductQueryDto) {
    const filter = this.buildFilter(query, {
      publishedOnly: true,
    });
    return this.queryWithPagination(filter, query);
  }

  async findById(id: string, user?: AuthUser) {
    const product = await this.findOneOrFail(id, { user });
    return { product };
  }

  async findPublishedById(id: string) {
    const product = await this.findOneOrFail(id, { publishedOnly: true });
    return { product };
  }

  async update(id: string, dto: UpdateProductDto, user?: AuthUser) {
    await this.findOneOrFail(id, { user });

    const patch = { ...dto };
    if (getEmployeeBranchId(user)) {
      delete patch.branch;
    } else if (patch.branch) {
      await this.ensureBranchExists(patch.branch);
    }

    const update = this.buildUpdatePayload(patch);

    const product = await this.productModel
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate('branch', 'name address phone email workingHours')
      .exec();

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    return { product };
  }

  async updateStatus(id: string, status: ProductStatus, user?: AuthUser) {
    return this.update(id, { status }, user);
  }

  async updatePrice(id: string, price: number, user?: AuthUser) {
    return this.update(id, { price }, user);
  }

  async delete(id: string, user?: AuthUser) {
    await this.findOneOrFail(id, { user });
    const product = await this.productModel.findByIdAndDelete(id).exec();
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    return { message: 'Товар удалён' };
  }

  async deletePhoto(id: string, photoUrl: string, user?: AuthUser) {
    const product = await this.findOneOrFail(id, { user });
    const photos = product.photos.filter((url) => url !== photoUrl);
    if (photos.length === product.photos.length) {
      throw new NotFoundException('Фотография не найдена в товаре');
    }
    product.photos = photos;
    await product.save();
    return { product: await this.findOneOrFail(id, { user }) };
  }

  async reorderPhotos(id: string, photoUrls: string[], user?: AuthUser) {
    const product = await this.findOneOrFail(id, { user });
    const current = new Set(product.photos);

    if (photoUrls.length !== product.photos.length) {
      throw new BadRequestException(
        'Список photoUrls должен содержать все фотографии товара',
      );
    }

    for (const url of photoUrls) {
      if (!current.has(url)) {
        throw new BadRequestException(`Неизвестный URL фотографии: ${url}`);
      }
    }

    product.photos = photoUrls;
    await product.save();
    return { product: await this.findOneOrFail(id, { user }) };
  }

  private applyBranchScope(
    filter: QueryFilter<ProductDocument>,
    user?: AuthUser,
  ): void {
    const branchOid = employeeBranchObjectId(user);
    if (branchOid) {
      filter.branch = branchOid;
    }
  }

  private async queryWithPagination(
    filter: QueryFilter<ProductDocument>,
    query: ProductQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('branch', 'name address phone email workingHours')
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      products,
      total,
      page,
      limit,
      filters: this.sanitizeFilters(query),
    };
  }

  private buildFilter(
    query: ProductQueryDto,
    options: { publishedOnly?: boolean; includeAllStatuses?: boolean } = {},
  ): QueryFilter<ProductDocument> {
    const filter: QueryFilter<ProductDocument> = {};

    if (options.publishedOnly) {
      filter.status = {
        $nin: [ProductStatus.HIDDEN, ProductStatus.SOLD],
      };
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.brand) {
      filter.brand = new RegExp(query.brand, 'i');
    }

    if (query.condition) {
      filter.condition = query.condition;
    }

    if (query.branch) {
      filter.branch = new Types.ObjectId(query.branch);
    }

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      filter.price = {};
      if (query.priceMin !== undefined) {
        filter.price.$gte = query.priceMin;
      }
      if (query.priceMax !== undefined) {
        filter.price.$lte = query.priceMax;
      }
    }

    if (query.search?.trim()) {
      filter.$text = { $search: query.search.trim() };
    }

    return filter;
  }

  private sanitizeFilters(query: ProductQueryDto) {
    const { page, limit, ...filters } = query;
    return filters;
  }

  private async findOneOrFail(
    id: string,
    options: { publishedOnly?: boolean; user?: AuthUser } = {},
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Товар не найден');
    }

    const filter: QueryFilter<ProductDocument> = { _id: id };
    if (options.publishedOnly) {
      filter.status = {
        $nin: [ProductStatus.HIDDEN, ProductStatus.SOLD],
      };
    }
    this.applyBranchScope(filter, options.user);

    const product = await this.productModel
      .findOne(filter)
      .populate('branch', 'name address phone email workingHours')
      .exec();

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    return product;
  }

  private buildUpdatePayload(dto: UpdateProductDto): Record<string, unknown> {
    const update: Record<string, unknown> = {};

    if (dto.name !== undefined) update.name = dto.name;
    if (dto.category !== undefined) update.category = dto.category;
    if (dto.brand !== undefined) update.brand = dto.brand;
    if (dto.model !== undefined) update['model'] = dto.model;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.condition !== undefined) update.condition = dto.condition;
    if (dto.price !== undefined) update.price = dto.price;
    if (dto.photos !== undefined) update.photos = dto.photos;
    if (dto.branch !== undefined) {
      update.branch = new Types.ObjectId(dto.branch);
    }
    if (dto.status !== undefined) update.status = dto.status;

    return update;
  }

  private async ensureBranchExists(branchId: string): Promise<void> {
    if (!Types.ObjectId.isValid(branchId)) {
      throw new NotFoundException('Филиал не найден');
    }
    const branch = await this.branchModel.findById(branchId).exec();
    if (!branch?.isActive) {
      throw new NotFoundException('Филиал не найден');
    }
  }
}
