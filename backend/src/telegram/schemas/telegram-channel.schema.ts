import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TelegramChannelDocument = HydratedDocument<TelegramChannel>;

@Schema({ timestamps: true })
export class TelegramChannel {
  @Prop({ required: true, trim: true })
  name: string;

  /** @channelusername или числовой id -100… */
  @Prop({ required: true, trim: true, unique: true })
  chatId: string;

  @Prop({ trim: true })
  username?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const TelegramChannelSchema =
  SchemaFactory.createForClass(TelegramChannel);

TelegramChannelSchema.index({ isActive: 1 });
