import { Branch } from './branch.model';

export const PRODUCT_CATEGORIES = [
  'смартфоны',
  'ноутбуки',
  'техника',
  'золото',
  'часы',
  'аксессуары',
] as const;

export const PRODUCT_CONDITIONS = [
  'отличное',
  'хорошее',
  'удовлетворительное',
  'плохое',
] as const;

export const PRODUCT_STATUSES = [
  'В наличии',
  'Зарезервирован',
  'Продан',
  'Скрыт',
] as const;

export const ADMIN_PRODUCT_STATUSES = [
  'В наличии',
  'Зарезервирован',
  'Скрыт',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface Product {
  _id: string;
  name: string;
  category: ProductCategory;
  brand?: string;
  model?: string;
  description?: string;
  condition: ProductCondition;
  price: number;
  photos: string[];
  branch: string | Branch;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductPayload {
  name: string;
  category: ProductCategory;
  brand?: string;
  model?: string;
  description?: string;
  condition: ProductCondition;
  price: number;
  photos: string[];
  branch: string;
  status: ProductStatus;
}

export interface ProductQuery {
  category?: ProductCategory;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: ProductCondition;
  branch?: string;
  search?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

export interface ProductsListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  filters?: Record<string, unknown>;
}

export interface ProductResponse {
  product: Product;
}

export function getBranchId(branch: string | Branch): string {
  return typeof branch === 'string' ? branch : branch._id;
}

export function getBranchName(product: Product): string {
  const b = product.branch;
  return typeof b === 'object' && b !== null && 'name' in b ? b.name : '—';
}

export function getBranchDetails(
  product: Product,
): Branch | null {
  const b = product.branch;
  return typeof b === 'object' && b !== null && '_id' in b ? b : null;
}

export function conditionScore(condition: ProductCondition): number {
  switch (condition) {
    case 'отличное':
      return 4;
    case 'хорошее':
      return 3;
    case 'удовлетворительное':
      return 2;
    default:
      return 1;
  }
}
