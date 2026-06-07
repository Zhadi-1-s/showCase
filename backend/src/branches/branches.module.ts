import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { Branch, BranchSchema } from './schemas/branch.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Branch.name, schema: BranchSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [MongooseModule, BranchesService],
})
export class BranchesModule {}
