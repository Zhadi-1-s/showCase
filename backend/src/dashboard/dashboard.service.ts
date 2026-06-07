import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema';
import { employeeBranchObjectId } from '../common/utils/branch-scope.util';
import { ProductStatus } from '../common/enums/product.enums';
import { UserRole } from '../common/enums/user.enums';
import { Product, ProductDocument } from '../products/schemas/product.schema';

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

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
  ) {}

  async getStatistics(user: AuthUser) {
    const match = this.productMatch(user);

    const [
      statusAgg,
      categoryAgg,
      branchAgg,
      recentProducts,
      totalProducts,
      publishedProducts,
      stockValueAgg,
      activeBranches,
    ] = await Promise.all([
      this.productModel.aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.productModel.aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.productModel.aggregate<{
        _id: Types.ObjectId;
        count: number;
        inStock: number;
        branchName: string;
      }>([
        { $match: match },
        {
          $group: {
            _id: '$branch',
            count: { $sum: 1 },
            inStock: {
              $sum: {
                $cond: [{ $eq: ['$status', ProductStatus.IN_STOCK] }, 1, 0],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branchDoc',
          },
        },
        { $unwind: '$branchDoc' },
        {
          $project: {
            count: 1,
            inStock: 1,
            branchName: '$branchDoc.name',
          },
        },
        { $sort: { count: -1 } },
      ]),
      this.productModel
        .find(match)
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('branch', 'name')
        .lean()
        .exec(),
      this.productModel.countDocuments(match).exec(),
      this.productModel
        .countDocuments({
          ...match,
          status: { $nin: [ProductStatus.HIDDEN, ProductStatus.SOLD] },
        })
        .exec(),
      this.productModel.aggregate<{ total: number }>([
        {
          $match: {
            ...match,
            status: {
              $in: [ProductStatus.IN_STOCK, ProductStatus.RESERVED],
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),
      this.countActiveBranches(user),
    ]);

    const statusMap = new Map(
      statusAgg.map((row) => [row._id, row.count] as const),
    );

    const summary = {
      totalProducts,
      publishedProducts,
      inStock: statusMap.get(ProductStatus.IN_STOCK) ?? 0,
      reserved: statusMap.get(ProductStatus.RESERVED) ?? 0,
      sold: statusMap.get(ProductStatus.SOLD) ?? 0,
      hidden: statusMap.get(ProductStatus.HIDDEN) ?? 0,
      activeBranches,
      stockValue: stockValueAgg[0]?.total ?? 0,
    };

    const byStatus: DashboardStatusRow[] = Object.values(ProductStatus).map(
      (status) => ({
        status,
        count: statusMap.get(status) ?? 0,
      }),
    );

    const byCategory: DashboardCategoryRow[] = categoryAgg.map((row) => ({
      category: row._id,
      count: row.count,
    }));

    const byBranch: DashboardBranchRow[] = branchAgg.map((row) => ({
      branchId: String(row._id),
      branchName: row.branchName,
      count: row.count,
      inStock: row.inStock,
    }));

    return {
      summary,
      byStatus,
      byCategory,
      byBranch,
      recentProducts,
      scopedToBranch: Boolean(user.role === UserRole.EMPLOYEE && user.branch),
    };
  }

  private productMatch(user: AuthUser): QueryFilter<ProductDocument> {
    const branchOid = employeeBranchObjectId(user);
    return branchOid ? { branch: branchOid } : {};
  }

  private async countActiveBranches(user: AuthUser): Promise<number> {
    if (user.role === UserRole.EMPLOYEE && user.branch) {
      const branch = await this.branchModel
        .findOne({ _id: user.branch, isActive: true })
        .exec();
      return branch ? 1 : 0;
    }
    return this.branchModel.countDocuments({ isActive: true }).exec();
  }
}
