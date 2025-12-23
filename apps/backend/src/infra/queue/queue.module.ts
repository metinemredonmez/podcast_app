import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueService } from './queue.service';
import queueConfig from '../../config/queue.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(queueConfig)],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
