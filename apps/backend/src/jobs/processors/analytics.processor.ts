import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { AnalyticsQueuePayload } from '../../modules/analytics/interfaces/analytics-queue-payload.interface';

@Injectable()
@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<AnalyticsQueuePayload>): Promise<void> {
    this.logger.debug(`Processing analytics job ${job.id}`);
    try {
      const occurredAt = job.data.occurredAt ? new Date(job.data.occurredAt) : new Date();
      const data: Prisma.AnalyticsEventCreateInput = {
        tenantId: job.data.tenantId,
        userId: job.data.userId,
        podcastId: job.data.podcastId,
        episodeId: job.data.episodeId,
        eventType: job.data.eventType,
        occurredAt,
      };

      if (job.data.metadata !== undefined) {
        data.metadata = job.data.metadata as Prisma.JsonValue;
      } else {
        data.metadata = {
          ingestedAt: new Date().toISOString(),
          source: 'queue',
        } as Prisma.JsonValue;
      }

      await this.prisma.analyticsEvent.create({ data });
    } catch (error) {
      this.logger.error(`Failed to process analytics job ${job.id}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
