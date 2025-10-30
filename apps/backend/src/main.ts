import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Global prefix
  app.setGlobalPrefix('api');

  // ✅ Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ CORS config
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // ✅ Swagger config
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Podcast API')
    .setDescription('Podcast backend service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  // ❗ useGlobalPrefix: true KULLANMA — 404 sebebi olur
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  // ✅ Start server
  const port = process.env.PORT || 3300;
  await app.listen(port);

  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`🔌 WebSocket namespaces:`);
  console.log(`   - ws://localhost:${port}/notifications`);
  console.log(`   - ws://localhost:${port}/chat`);
  console.log(`   - ws://localhost:${port}/live`);
  console.log(`📚 Swagger docs: ${await app.getUrl()}/api/docs`);
}

bootstrap();
