import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import storageConfig from './config/storage.config';
import queueConfig from './config/queue.config';
import loggerConfig from './config/logger.config';
import metricsConfig from './config/metrics.config';
import mailConfig from './config/mail.config';
import { InfraModule } from './infra/infra.module';
import { WsModule } from './ws/ws.module';
import { JobsModule } from './jobs/jobs.module';
// Removed DatabaseModule (TypeORM) in favor of Prisma
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HocasModule } from './modules/hocas/hocas.module';
import { PodcastsModule } from './modules/podcasts/podcasts.module';
import { EpisodesModule } from './modules/episodes/episodes.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { FollowsModule } from './modules/follows/follows.module';
import { CommentsModule } from './modules/comments/comments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { StorageModule } from './modules/storage/storage.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { AdminModule } from './modules/admin/admin.module';
import { PrismaService } from './infra/prisma.service';
import { HealthModule } from './modules/health/health.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseTimeInterceptor } from './common/interceptors/response-time.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        storageConfig,
        queueConfig,
        loggerConfig,
        metricsConfig,
        mailConfig,
      ],
    }),
    InfraModule,
    WsModule,
    JobsModule,
    AuthModule,
    UsersModule,
    HocasModule,
    PodcastsModule,
    EpisodesModule,
    CategoriesModule,
    FollowsModule,
    CommentsModule,
    NotificationsModule,
    SearchModule,
    AnalyticsModule,
    StorageModule,
    StreamingModule,
    AdminModule,
    ThrottlerModule.forRoot({ ttl: 60, limit: 100 }),
    HealthModule,
  ],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
  ],
})
export class AppModule {}
