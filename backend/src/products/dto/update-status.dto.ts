import { IsEnum } from 'class-validator';
import { PRODUCT_STATUSES, ProductStatus } from '../../common/enums/product.enums';

export class UpdateStatusDto {
  @IsEnum(PRODUCT_STATUSES)
  status: ProductStatus;
}
