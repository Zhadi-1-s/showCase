import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { DeletePhotoDto } from './dto/delete-photo.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('published')
  @ApiOperation({ summary: 'Витрина: список товаров (без Скрыт/Продан)' })
  findPublished(@Query() query: ProductQueryDto) {
    return this.productsService.findPublished(query);
  }

  @Get('published/:id')
  @ApiOperation({ summary: 'Витрина: товар по ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId товара' })
  @ApiResponse({ status: 404, description: 'Товар не найден или недоступен' })
  findPublishedById(@Param('id') id: string) {
    return this.productsService.findPublishedById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Создать товар' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.productsService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Админ: все товары с фильтрами' })
  findAll(@Query() query: ProductQueryDto, @CurrentUser() user: AuthUser) {
    return this.productsService.findAll(query, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Админ: товар по ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId товара' })
  findById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.findById(id, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Обновить товар' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId товара' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Изменить статус товара' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId товара' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.updateStatus(id, dto.status, user);
  }

  @Patch(':id/price')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Изменить цену товара' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId товара' })
  updatePrice(
    @Param('id') id: string,
    @Body() dto: UpdatePriceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.updatePrice(id, dto.price, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Удалить товар' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId товара' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.delete(id, user);
  }

  @Patch(':id/photos/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Удалить фото из товара' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId товара' })
  deletePhoto(
    @Param('id') id: string,
    @Body() dto: DeletePhotoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.deletePhoto(id, dto.photoUrl, user);
  }

  @Patch(':id/photos/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Изменить порядок фотографий' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId товара' })
  reorderPhotos(
    @Param('id') id: string,
    @Body() dto: ReorderPhotosDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.reorderPhotos(id, dto.photoUrls, user);
  }
}
