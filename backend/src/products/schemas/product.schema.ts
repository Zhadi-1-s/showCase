import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Branch } from '../../branches/schemas/branch.schema';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
  ProductCategory,
  ProductCondition,
  ProductStatus,
} from '../../common/enums/product.enums';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: PRODUCT_CATEGORIES, index: true })
  category: ProductCategory;

  @Prop({ trim: true, index: true })
  brand?: string;

  @Prop({ trim: true })
  model?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, enum: PRODUCT_CONDITIONS })
  condition: ProductCondition;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ type: Types.ObjectId, ref: Branch.name, required: true, index: true })
  branch: Types.ObjectId;

  @Prop({
    required: true,
    enum: PRODUCT_STATUSES,
    default: ProductStatus.IN_STOCK,
    index: true,
  })
  status: ProductStatus;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
