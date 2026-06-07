export enum ProductCategory {
  SMARTPHONES = 'смартфоны',
  LAPTOPS = 'ноутбуки',
  ELECTRONICS = 'техника',
  GOLD = 'золото',
  WATCHES = 'часы',
  ACCESSORIES = 'аксессуары',
}

export enum ProductCondition {
  EXCELLENT = 'отличное',
  GOOD = 'хорошее',
  FAIR = 'удовлетворительное',
  POOR = 'плохое',
}

export enum ProductStatus {
  IN_STOCK = 'В наличии',
  RESERVED = 'Зарезервирован',
  SOLD = 'Продан',
  HIDDEN = 'Скрыт',
}

export const PRODUCT_CATEGORIES = Object.values(ProductCategory);
export const PRODUCT_CONDITIONS = Object.values(ProductCondition);
export const PRODUCT_STATUSES = Object.values(ProductStatus);
