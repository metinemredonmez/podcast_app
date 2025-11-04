import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JobsModule } from '../../jobs/jobs.module';
import { WsModule } from '../../ws/ws.module';

@Module({
  imports: [JobsModule, WsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
