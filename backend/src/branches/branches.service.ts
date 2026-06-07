import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchActiveDto } from './dto/update-branch-active.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch, BranchDocument } from './schemas/branch.schema';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  findAllActive() {
    return this.branchModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async findAllForAdmin() {
    const branches = await this.branchModel.find().sort({ name: 1 }).lean().exec();
    const counts = await this.productModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([{ $group: { _id: '$branch', count: { $sum: 1 } } }]);

    const countMap = new Map(
      counts.map((row) => [String(row._id), row.count] as const),
    );

    return branches.map((branch) => ({
      ...branch,
      productCount: countMap.get(String(branch._id)) ?? 0,
    }));
  }

  async findById(id: string) {
    const branch = await this.findOneOrFail(id);
    const productCount = await this.productModel
      .countDocuments({ branch: branch._id })
      .exec();
    return { branch, productCount };
  }

  async create(dto: CreateBranchDto) {
    const branch = await this.branchModel.create({
      name: dto.name.trim(),
      address: dto.address.trim(),
      phone: dto.phone.trim(),
      email: dto.email?.trim(),
      workingHours: dto.workingHours?.trim(),
      isActive: dto.isActive ?? true,
    });
    return { branch };
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.findOneOrFail(id);

    const update: Record<string, unknown> = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.address !== undefined) update.address = dto.address.trim();
    if (dto.phone !== undefined) update.phone = dto.phone.trim();
    if (dto.email !== undefined) update.email = dto.email?.trim() || undefined;
    if (dto.workingHours !== undefined) {
      update.workingHours = dto.workingHours?.trim() || undefined;
    }
    if (dto.isActive !== undefined) update.isActive = dto.isActive;

    const branch = await this.branchModel
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();

    if (!branch) {
      throw new NotFoundException('Филиал не найден');
    }

    return { branch };
  }

  async setActive(id: string, dto: UpdateBranchActiveDto) {
    const branch = await this.findOneOrFail(id);

    if (!dto.isActive) {
      const productCount = await this.productModel
        .countDocuments({ branch: branch._id })
        .exec();
      if (productCount > 0) {
        throw new ConflictException(
          'Нельзя отключить филиал: к нему привязаны товары. Сначала перенесите или удалите товары.',
        );
      }
    }

    branch.isActive = dto.isActive;
    await branch.save();
    return { branch };
  }

  async remove(id: string) {
    const branch = await this.findOneOrFail(id);
    const productCount = await this.productModel
      .countDocuments({ branch: branch._id })
      .exec();

    if (productCount > 0) {
      throw new ConflictException(
        'Нельзя удалить филиал с привязанными товарами',
      );
    }

    await this.branchModel.findByIdAndDelete(id).exec();
    return { message: 'Филиал удалён' };
  }

  private async findOneOrFail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Филиал не найден');
    }

    const branch = await this.branchModel.findById(id).exec();
    if (!branch) {
      throw new NotFoundException('Филиал не найден');
    }

    return branch;
  }
}
