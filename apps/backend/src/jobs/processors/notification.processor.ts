import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { NotificationsGateway } from '../../ws/gateways/notifications.gateway';
import { NotificationJobPayload } from '../../modules/notifications/interfaces/notification-job-payload.interface';

@Injectable()
@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {
    super();
  }

  async process(job: Job<NotificationJobPayload>): Promise<void> {
    this.logger.debug(`Processing notification job ${job.id}`);
    try {
      const notification = await this.prisma.notification.create({
        data: {
          tenantId: job.data.tenantId,
          userId: job.data.userId,
          type: job.data.type,
          payload: job.data.payload as Prisma.JsonValue,
        },
      });

      this.gateway.emitNotification(notification);
    } catch (error) {
      this.logger.error(`Failed to process notification job ${job.id}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
