import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GatewayAdapter } from './ws/gateway.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Global prefix
  app.setGlobalPrefix('api');
  // @ts-ignore
  app.useWebSocketAdapter(new GatewayAdapter(app));

  // ✅ Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ CORS config
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : ['http://localhost:5175', 'http://localhost:19005'],
    credentials: true,
  });

  // ✅ Security headers
  app.use(helmet());

  // ✅ Swagger config (toggle with SWAGGER_ENABLED)
  const swaggerEnabled = (process.env.SWAGGER_ENABLED ?? 'true').toLowerCase() === 'true';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Podcast API')
      .setDescription('Podcast backend service API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    // ❗ useGlobalPrefix: true KULLANMA — 404 sebebi olur
    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

  // ✅ Start server
  const port = process.env.PORT || 3300;
  await app.listen(port);

  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`🔌 WebSocket namespaces:`);
  console.log(`   - ws://localhost:${port}/notifications`);
  console.log(`   - ws://localhost:${port}/chat`);
  console.log(`   - ws://localhost:${port}/live`);
  if (swaggerEnabled) {
    console.log(`📚 Swagger docs: ${await app.getUrl()}/api/docs`);
  } else {
    console.log('📚 Swagger docs disabled (SWAGGER_ENABLED=false)');
  }
}

bootstrap();
