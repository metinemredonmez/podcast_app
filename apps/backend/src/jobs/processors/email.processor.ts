import { Processor, WorkerHost } from '@nestjs/bullmq';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  async process(job: unknown): Promise<void> {
    void job;
  }
}
