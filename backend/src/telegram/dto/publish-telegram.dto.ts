import { IsMongoId } from 'class-validator';

export class PublishTelegramDto {
  @IsMongoId()
  channelId: string;
}
