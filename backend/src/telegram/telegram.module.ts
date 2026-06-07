import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { TelegramApiService } from './telegram-api.service';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import {
  TelegramChannel,
  TelegramChannelSchema,
} from './schemas/telegram-channel.schema';
import {
  TelegramPublication,
  TelegramPublicationSchema,
} from './schemas/telegram-publication.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TelegramChannel.name, schema: TelegramChannelSchema },
      { name: TelegramPublication.name, schema: TelegramPublicationSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  controllers: [TelegramController],
  providers: [TelegramApiService, TelegramService],
})
export class TelegramModule {}
