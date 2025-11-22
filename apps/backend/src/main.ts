import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
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
  const bootstrapLogger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Use Winston logger
  const logger = app.get(AppLoggerService);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Global exception filter (Sentry + logging)
  app.useGlobalFilters(new SentryExceptionFilter(logger));

  // Global prefix
  app.setGlobalPrefix('api');

  // WebSocket adapter
  const wsAdapter = new GatewayAdapter(app);
  app.useWebSocketAdapter(wsAdapter as any);

  // Validation pipes with security settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      // Limit payload size for validation
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // CORS configuration - production ready
  const nodeEnv = process.env.NODE_ENV || 'development';
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // In production, CORS_ORIGINS must be explicitly set
  if (nodeEnv === 'production' && corsOrigins.length === 0) {
    bootstrapLogger.warn(
      'CORS_ORIGINS not set in production! Defaulting to no allowed origins.',
    );
  }

  // Development fallback origins (only used if CORS_ORIGINS not set)
  const devOrigins = [
    'http://localhost:5173', // Vite default
    'http://localhost:5174', // Vite alt
    'http://localhost:5175', // Admin panel
    'http://localhost:3000', // Next.js default
    'http://localhost:19005', // Expo web
    'http://localhost:19006', // Expo alt
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  const allowedOrigins =
    corsOrigins.length > 0
      ? corsOrigins
      : nodeEnv === 'development'
        ? devOrigins
        : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log rejected origins in development
      if (nodeEnv === 'development') {
        bootstrapLogger.warn(`CORS rejected origin: ${origin}`);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Tenant-Id',
      'X-Request-Id',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Request-Id',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
    ],
    maxAge: 86400, // Cache preflight response for 24 hours
  });

  // Security headers with enhanced configuration
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: nodeEnv === 'production' ? { maxAge: 31536000 } : false,
    }),
  );

  // Swagger documentation (disabled in production by default)
  const swaggerEnabled =
    (process.env.SWAGGER_ENABLED ?? (nodeEnv === 'development' ? 'true' : 'false')).toLowerCase() ===
    'true';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Podcast API')
      .setDescription(
        `
Podcast backend service API documentation.

## Authentication
All protected endpoints require a Bearer token in the Authorization header.

## Rate Limiting
- Standard endpoints: 100 requests/minute
- Auth endpoints: 10 requests/minute
- Strict endpoints: 3 requests/minute

## Tenant Isolation
Most endpoints are tenant-scoped. Include X-Tenant-Id header or use the tenantId from your JWT.
      `.trim(),
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication & authorization')
      .addTag('Podcasts', 'Podcast management')
      .addTag('Episodes', 'Episode management')
      .addTag('Users', 'User management')
      .addTag('Comments', 'Comment system')
      .addTag('Analytics', 'Analytics & events')
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

  // Start server
  const port = process.env.PORT || 3300;
  await app.listen(port);

  // Log startup info
  const appUrl = await app.getUrl();
  bootstrapLogger.log(`Application running on: ${appUrl}`);
  bootstrapLogger.log(`Environment: ${nodeEnv}`);
  bootstrapLogger.log(`WebSocket endpoints:`);
  bootstrapLogger.log(`  - ws://localhost:${port}/notifications`);
  bootstrapLogger.log(`  - ws://localhost:${port}/chat`);
  bootstrapLogger.log(`  - ws://localhost:${port}/live`);

  if (swaggerEnabled) {
    bootstrapLogger.log(`Swagger docs: ${appUrl}/api/docs`);
  } else {
    bootstrapLogger.log('Swagger docs disabled');
  }

  if (allowedOrigins.length > 0) {
    bootstrapLogger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  } else {
    bootstrapLogger.warn('CORS: No origins configured');
  }
}

bootstrap();
