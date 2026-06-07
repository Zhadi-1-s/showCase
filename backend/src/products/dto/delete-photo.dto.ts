import { IsString, MinLength } from 'class-validator';

export class DeletePhotoDto {
  @IsString()
  @MinLength(1)
  photoUrl: string;
}
