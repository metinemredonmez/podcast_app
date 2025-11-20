import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { GatewayAdapter } from './ws/gateway.adapter';
import { initSentry } from './common/sentry/sentry.config';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { AppLoggerService } from './common/logger/logger.service';

// Initialize Sentry before NestJS app
initSentry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Use Winston logger
  const logger = app.get(AppLoggerService);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // ✅ Global exception filter (Sentry + logging)
  app.useGlobalFilters(new SentryExceptionFilter(logger));

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

  const allowedOrigins = corsOrigins.length > 0
    ? corsOrigins
    : [
        'http://localhost:5175',  // Admin panel (dev)
        'http://localhost:19005', // Mobile app (dev)
        'http://localhost:3000',  // Frontend (dev)
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 3600, // Cache preflight response for 1 hour
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
