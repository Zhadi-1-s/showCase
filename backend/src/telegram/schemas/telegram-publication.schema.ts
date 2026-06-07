import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { TelegramChannel } from './telegram-channel.schema';

export type TelegramPublicationDocument =
  HydratedDocument<TelegramPublication>;

export enum TelegramPublicationStatus {
  PUBLISHED = 'published',
  ERROR = 'error',
  REMOVED = 'removed',
}

@Schema({ timestamps: true })
export class TelegramPublication {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true, index: true })
  product: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: TelegramChannel.name,
    required: true,
    index: true,
  })
  channel: Types.ObjectId;

  @Prop({ required: true })
  messageId: number;

  @Prop({
    required: true,
    enum: Object.values(TelegramPublicationStatus),
    default: TelegramPublicationStatus.PUBLISHED,
  })
  status: TelegramPublicationStatus;

  @Prop({ trim: true })
  errorMessage?: string;

  @Prop()
  lastSyncAt?: Date;

  @Prop({ trim: true })
  postUrl?: string;
}

export const TelegramPublicationSchema =
  SchemaFactory.createForClass(TelegramPublication);

TelegramPublicationSchema.index({ product: 1, channel: 1 }, { unique: true });
