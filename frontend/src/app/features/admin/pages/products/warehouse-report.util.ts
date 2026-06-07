import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  Product,
  ProductStatus,
  getBranchId,
  getBranchName,
} from '../../../../core/models/product.model';

const STOCK_STATUSES: ProductStatus[] = ['В наличии', 'Зарезервирован'];

export interface WarehouseStatusRow {
  status: ProductStatus;
  count: number;
  value: number;
}

export interface WarehouseCategoryRow {
  category: string;
  count: number;
  value: number;
  stockValue: number;
}

export interface WarehouseBranchRow {
  branchId: string;
  branchName: string;
  count: number;
  stockValue: number;
  totalValue: number;
  inStock: number;
  reserved: number;
  sold: number;
  hidden: number;
}

export interface WarehouseReport {
  totalItems: number;
  stockValue: number;
  totalValue: number;
  byStatus: WarehouseStatusRow[];
  byCategory: WarehouseCategoryRow[];
  byBranch: WarehouseBranchRow[];
}

export function buildWarehouseReport(products: Product[]): WarehouseReport {
  const statusCounts = new Map<ProductStatus, { count: number; value: number }>();
  for (const s of PRODUCT_STATUSES) {
    statusCounts.set(s, { count: 0, value: 0 });
  }

  const categoryMap = new Map<
    string,
    { count: number; value: number; stockValue: number }
  >();
  for (const c of PRODUCT_CATEGORIES) {
    categoryMap.set(c, { count: 0, value: 0, stockValue: 0 });
  }

  const branchMap = new Map<
    string,
    {
      branchName: string;
      count: number;
      stockValue: number;
      totalValue: number;
      statuses: Map<ProductStatus, number>;
    }
  >();

  let stockValue = 0;
  let totalValue = 0;

  for (const p of products) {
    totalValue += p.price;

    const isStock = STOCK_STATUSES.includes(p.status);
    if (isStock) {
      stockValue += p.price;
    }

    const st = statusCounts.get(p.status)!;
    st.count += 1;
    st.value += p.price;

    const cat = categoryMap.get(p.category) ?? {
      count: 0,
      value: 0,
      stockValue: 0,
    };
    cat.count += 1;
    cat.value += p.price;
    if (isStock) cat.stockValue += p.price;
    categoryMap.set(p.category, cat);

    const branchId = getBranchId(p.branch);
    const existing = branchMap.get(branchId) ?? {
      branchName: getBranchName(p),
      count: 0,
      stockValue: 0,
      totalValue: 0,
      statuses: new Map<ProductStatus, number>(),
    };
    for (const s of PRODUCT_STATUSES) {
      if (!existing.statuses.has(s)) existing.statuses.set(s, 0);
    }
    existing.count += 1;
    existing.totalValue += p.price;
    if (isStock) existing.stockValue += p.price;
    existing.statuses.set(p.status, (existing.statuses.get(p.status) ?? 0) + 1);
    branchMap.set(branchId, existing);
  }

  const byStatus: WarehouseStatusRow[] = PRODUCT_STATUSES.map((status) => {
    const row = statusCounts.get(status)!;
    return { status, count: row.count, value: row.value };
  });

  const byCategory: WarehouseCategoryRow[] = [...categoryMap.entries()]
    .map(([category, row]) => ({ category, ...row }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const byBranch: WarehouseBranchRow[] = [...branchMap.entries()]
    .map(([branchId, row]) => ({
      branchId,
      branchName: row.branchName,
      count: row.count,
      stockValue: row.stockValue,
      totalValue: row.totalValue,
      inStock: row.statuses.get('В наличии') ?? 0,
      reserved: row.statuses.get('Зарезервирован') ?? 0,
      sold: row.statuses.get('Продан') ?? 0,
      hidden: row.statuses.get('Скрыт') ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalItems: products.length,
    stockValue,
    totalValue,
    byStatus,
    byCategory,
    byBranch,
  };
}

export function statusPercent(count: number, total: number): number {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}
