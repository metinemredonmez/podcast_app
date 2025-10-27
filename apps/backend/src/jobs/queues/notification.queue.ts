import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationQueueService {
  constructor(@InjectQueue('notification') private readonly queue: Queue) {}

  async enqueue(payload: unknown): Promise<void> {
    await this.queue.add('notification', payload, { attempts: 3 });
  }
}
