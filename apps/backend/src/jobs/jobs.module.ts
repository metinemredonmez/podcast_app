import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailQueueService } from './queues/email.queue';
import { NotificationQueueService } from './queues/notification.queue';
import { AnalyticsQueueService } from './queues/analytics.queue';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { AnalyticsProcessor } from './processors/analytics.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url:
            config.get<string>('redis.url') ??
            process.env.REDIS_URL ??
            'redis://localhost:6390',
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'notification' },
      { name: 'analytics' },
    ),
  ],
  providers: [
    EmailQueueService,
    NotificationQueueService,
    AnalyticsQueueService,
    EmailProcessor,
    NotificationProcessor,
    AnalyticsProcessor,
  ],
  exports: [EmailQueueService, NotificationQueueService, AnalyticsQueueService],
})
export class JobsModule {}
