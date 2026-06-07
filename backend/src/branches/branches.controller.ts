import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/user.enums';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchActiveDto } from './dto/update-branch-active.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Список активных филиалов (публичный)' })
  async findAll() {
    const branches = await this.branchesService.findAllActive();
    return { branches };
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Админ: все филиалы с числом товаров' })
  async findAllAdmin() {
    const branches = await this.branchesService.findAllForAdmin();
    return { branches };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Админ: филиал по ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId филиала' })
  findById(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Админ: создать филиал' })
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Админ: обновить филиал' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId филиала' })
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Patch(':id/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Админ: включить/отключить филиал' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId филиала' })
  @ApiResponse({ status: 409, description: 'Есть привязанные товары' })
  setActive(@Param('id') id: string, @Body() dto: UpdateBranchActiveDto) {
    return this.branchesService.setActive(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Админ: удалить филиал без товаров' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId филиала' })
  @ApiResponse({ status: 409, description: 'Есть привязанные товары' })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
