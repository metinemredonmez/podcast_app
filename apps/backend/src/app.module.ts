import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WsModule } from './ws/ws.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { InfraModule } from './infra/infra.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { TenantsModule } from './modules/tenants/tenants.module';
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
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '../../.env.shared'],
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
