import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

function cleanEnv(value: string | undefined): string {
  return (value ?? '').replace(/;+$/g, '').trim();
}

export function configureCloudinary(config: ConfigService): void {
  const cloud_name = cleanEnv(config.get<string>('CLOUDINARY_CLOUD_NAME'));
  const api_key = cleanEnv(config.get<string>('CLOUDINARY_API_KEY'));
  const api_secret = cleanEnv(config.get<string>('CLOUDINARY_API_SECRET'));

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env',
    );
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });
}

export { cloudinary };
