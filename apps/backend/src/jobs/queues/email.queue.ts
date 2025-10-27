import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue('email') private readonly queue: Queue) {}

  async enqueue(payload: unknown): Promise<void> {
    await this.queue.add('email', payload, { attempts: 3 });
  }
}
