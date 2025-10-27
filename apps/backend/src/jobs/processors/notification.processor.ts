import { Processor, WorkerHost } from '@nestjs/bullmq';

@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  async process(job: unknown): Promise<void> {
    void job;
  }
}
