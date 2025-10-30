import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WsModule } from './ws/ws.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { InfraModule } from './infra/infra.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
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
import { HealthModule } from './modules/health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development',
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    PrismaModule,
    InfraModule,
    JobsModule,
    WsModule,
    AuthModule,
    UsersModule,
    TenantsModule,
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
  ],
})
export class AppModule {}
