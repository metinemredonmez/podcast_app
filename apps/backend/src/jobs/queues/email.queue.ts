import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailQueueService {
  private readonly attempts: number;

  constructor(
    @InjectQueue('email') private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {
    this.attempts = this.config.get<number>('queue.retryAttempts', { infer: true }) ?? 3;
  }

  async enqueue(payload: unknown): Promise<void> {
    await this.queue.add('email', payload, { attempts: this.attempts });
  }
}
