import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationJobPayload } from '../../modules/notifications/interfaces/notification-job-payload.interface';

@Injectable()
export class NotificationQueueService {
  private readonly attempts: number;

  constructor(
    @InjectQueue('notification') private readonly queue: Queue<NotificationJobPayload>,
    private readonly config: ConfigService,
  ) {
    this.attempts = this.config.get<number>('queue.retryAttempts', { infer: true }) ?? 3;
  }

  async enqueue(payload: NotificationJobPayload): Promise<void> {
    await this.queue.add('notification', payload, {
      attempts: this.attempts,
      removeOnFail: 50,
    });
  }
}
