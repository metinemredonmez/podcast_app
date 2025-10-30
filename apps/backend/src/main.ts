import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { validateEnvironment } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  validateEnvironment(process.env as Record<string, unknown>);
  const appConfig = configService.get<{ port: number; corsOrigins: string[] }>('app');
  const corsOrigins =
    appConfig?.corsOrigins && appConfig.corsOrigins.length > 0 ? appConfig.corsOrigins : true;
  app.setGlobalPrefix('api');
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Podcast API')
    .setDescription('API for Podcast app. Rate limit: 100 req/min per IP.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  const port = appConfig?.port ?? 3000;
  await app.listen(port);
  Logger.log(`Backend listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
