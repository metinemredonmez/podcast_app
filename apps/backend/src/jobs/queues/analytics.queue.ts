import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AnalyticsQueuePayload } from '../../modules/analytics/interfaces/analytics-queue-payload.interface';

const JOB_NAME = 'ingest-analytics-event';

@Injectable()
export class AnalyticsQueueService {
  private readonly attempts: number;

  constructor(
    @InjectQueue('analytics') private readonly queue: Queue<AnalyticsQueuePayload>,
    private readonly config: ConfigService,
  ) {
    this.attempts = this.config.get<number>('queue.retryAttempts', { infer: true }) ?? 3;
  }

  async enqueue(payload: AnalyticsQueuePayload): Promise<void> {
    await this.queue.add(JOB_NAME, payload, {
      attempts: this.attempts,
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }
}
