import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Lombard Showcase API')
    .setDescription(
      'REST API демо-платформы ломбарда: auth, филиалы, товары, витрина.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT из POST /api/auth/login → access_token',
      },
      'access-token',
    )
    .addTag('Health', 'Проверка сервиса')
    .addTag('Auth', 'Регистрация и вход')
    .addTag('Branches', 'Филиалы')
    .addTag('Products', 'Товары (админка и витрина)')
    .addTag('Uploads', 'Загрузка фото в Cloudinary')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
