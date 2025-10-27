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
import { DatabaseModule } from './database/database.module';
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
    DatabaseModule,
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
  ],
})
export class AppModule {}
