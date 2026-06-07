import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderPhotosDto {
  @IsArray()
  @IsString({ each: true })
  photoUrls: string[];
}
