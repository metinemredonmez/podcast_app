import { Processor, WorkerHost } from '@nestjs/bullmq';

@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  async process(job: unknown): Promise<void> {
    void job;
  }
}
