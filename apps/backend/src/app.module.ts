import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { WsModule } from './ws/ws.module';
import { InfraModule } from './infra/infra.module';
import { LoggerModule } from './common/logger/logger.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { CacheModule } from './common/cache/cache.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { HocasModule } from './modules/hocas';
import { PodcastsModule } from './modules/podcasts';
import { EpisodesModule } from './modules/episodes';
import { CategoriesModule } from './modules/categories';
import { FollowsModule } from './modules/follows';
import { CommentsModule } from './modules/comments';
import { NotificationsModule } from './modules/notifications';
import { SearchModule } from './modules/search';
import { AnalyticsModule } from './modules/analytics';
import { StorageModule } from './modules/storage';
import { StreamingModule } from './modules/streaming';
import { AdminModule } from './modules/admin';
import { HealthModule } from './modules/health/health.module';
import { ProgressModule } from './modules/progress/progress.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { AuditModule } from './modules/audit/audit.module';
import { CreatorAnalyticsModule } from './modules/creator-analytics/creator-analytics.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { HttpCacheInterceptor } from './common/interceptors/cache.interceptor';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import queueConfig from './config/queue.config';
import loggerConfig from './config/logger.config';
import metricsConfig from './config/metrics.config';
import storageConfig from './config/storage.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['../../.env.shared', '.env.dev'],
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        queueConfig,
        loggerConfig,
        metricsConfig,
        storageConfig,
        jwtConfig,
        mailConfig,
      ],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    LoggerModule,
    MetricsModule,
    CacheModule,
    InfraModule,
    JobsModule,
    WsModule,
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
    HealthModule,
    ProgressModule,
    FavoritesModule,
    PlaylistsModule,
    DownloadsModule,
    AuditModule,
    CreatorAnalyticsModule,
    AdminDashboardModule,
    ReviewsModule,
    SchedulingModule,
    ModerationModule,
    CollaborationModule,
    RecommendationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
