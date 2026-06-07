import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from 'cloudinary';
import { cloudinary, configureCloudinary } from '../config/cloudinary.config';

@Injectable()
export class UploadsService {
  private readonly folder: string;

  constructor(private readonly config: ConfigService) {
    configureCloudinary(config);
    this.folder =
      this.config.get<string>('CLOUDINARY_FOLDER')?.trim() || 'lombard-products';
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Файл не передан');
    }

    const result = await this.uploadBuffer(file.buffer, file.originalname);
    return { url: result.secure_url };
  }

  async uploadImages(
    files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files?.length) {
      throw new BadRequestException('Файлы не переданы');
    }

    const results = await Promise.all(
      files.map((file) => this.uploadBuffer(file.buffer, file.originalname)),
    );

    return { urls: results.map((r) => r.secure_url) };
  }

  private uploadBuffer(
    buffer: Buffer,
    filename: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          resource_type: 'image',
          public_id: this.buildPublicId(filename),
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result);
        },
      );

      upload.end(buffer);
    });
  }

  private buildPublicId(filename: string): string {
    const base = filename
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);
    return `${base}_${Date.now()}`;
  }
}
