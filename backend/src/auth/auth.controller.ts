import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthUser } from './interfaces/auth-user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация отключена (учётки создаёт администратор)' })
  @ApiResponse({ status: 403, description: 'Публичная регистрация недоступна' })
  register(@Body() _dto: RegisterDto) {
    throw new ForbiddenException(
      'Регистрация отключена. Обратитесь к администратору ломбарда.',
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход, получение JWT' })
  @ApiResponse({ status: 200, description: 'access_token и user' })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Профиль текущего пользователя' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }
}
