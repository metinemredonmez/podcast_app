import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3300);

  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`🔌 WebSocket namespaces:`);
  console.log(`   - ws://localhost:${process.env.PORT || 3300}/notifications`);
  console.log(`   - ws://localhost:${process.env.PORT || 3300}/chat`);
  console.log(`   - ws://localhost:${process.env.PORT || 3300}/live`);
  console.log(`📚 Swagger docs: ${await app.getUrl()}/api/docs`);
}

bootstrap();
