import { PartialType } from '@nestjs/swagger';
import { CreateTelegramChannelDto } from './create-telegram-channel.dto';

export class UpdateTelegramChannelDto extends PartialType(
  CreateTelegramChannelDto,
) {}
