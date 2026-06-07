import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
  ProductCategory,
  ProductCondition,
  ProductStatus,
} from '../../common/enums/product.enums';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(PRODUCT_CATEGORIES)
  category: ProductCategory;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PRODUCT_CONDITIONS)
  condition: ProductCondition;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @IsString({ each: true })
  photos: string[];

  @IsMongoId()
  branch: string;

  @IsEnum(PRODUCT_STATUSES)
  status: ProductStatus;
}
