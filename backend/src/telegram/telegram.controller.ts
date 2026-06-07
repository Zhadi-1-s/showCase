import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../common/enums/user.enums';
import { CreateTelegramChannelDto } from './dto/create-telegram-channel.dto';
import { PublishTelegramDto } from './dto/publish-telegram.dto';
import { UpdateTelegramChannelDto } from './dto/update-telegram-channel.dto';
import { TelegramService } from './telegram.service';

@ApiTags('Telegram')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('hub')
  @ApiOperation({ summary: 'Дашборд Telegram: бот, каналы, товары' })
  getHub(@CurrentUser() user: AuthUser) {
    return this.telegramService.getHub(user);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Список Telegram-каналов' })
  listChannels() {
    return this.telegramService.listChannels();
  }

  @Post('channels')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Добавить Telegram-канал или группу' })
  createChannel(@Body() dto: CreateTelegramChannelDto) {
    return this.telegramService.createChannel(dto);
  }

  @Put('channels/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Админ: обновить канал' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId канала' })
  updateChannel(
    @Param('id') id: string,
    @Body() dto: UpdateTelegramChannelDto,
  ) {
    return this.telegramService.updateChannel(id, dto);
  }

  @Delete('channels/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Админ: удалить канал' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId канала' })
  removeChannel(@Param('id') id: string) {
    return this.telegramService.removeChannel(id);
  }

  @Post('products/:productId/publish')
  @ApiOperation({ summary: 'Опубликовать товар в канале' })
  @ApiParam({ name: 'productId', description: 'MongoDB ObjectId товара' })
  publish(
    @Param('productId') productId: string,
    @Body() dto: PublishTelegramDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.telegramService.publish(productId, dto.channelId, user);
  }

  @Post('products/:productId/unpublish')
  @ApiOperation({ summary: 'Снять товар с канала' })
  @ApiParam({ name: 'productId', description: 'MongoDB ObjectId товара' })
  unpublish(
    @Param('productId') productId: string,
    @Body() dto: PublishTelegramDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.telegramService.unpublish(productId, dto.channelId, user);
  }

  @Post('products/:productId/sync')
  @ApiOperation({ summary: 'Обновить подпись поста (цена, описание)' })
  @ApiParam({ name: 'productId', description: 'MongoDB ObjectId товара' })
  sync(
    @Param('productId') productId: string,
    @Body() dto: PublishTelegramDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.telegramService.sync(productId, dto.channelId, user);
  }
}
