import { Product } from './product.model';

export interface DashboardSummary {
  totalProducts: number;
  publishedProducts: number;
  inStock: number;
  reserved: number;
  sold: number;
  hidden: number;
  activeBranches: number;
  stockValue: number;
}

export interface DashboardStatusRow {
  status: string;
  count: number;
}

export interface DashboardCategoryRow {
  category: string;
  count: number;
}

export interface DashboardBranchRow {
  branchId: string;
  branchName: string;
  count: number;
  inStock: number;
}

export interface DashboardStatistics {
  summary: DashboardSummary;
  byStatus: DashboardStatusRow[];
  byCategory: DashboardCategoryRow[];
  byBranch: DashboardBranchRow[];
  recentProducts: Product[];
  scopedToBranch: boolean;
}
