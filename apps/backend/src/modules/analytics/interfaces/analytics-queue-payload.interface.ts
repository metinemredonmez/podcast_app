import { AnalyticsEventType } from '../../../common/enums/prisma.enums';

export interface AnalyticsQueuePayload {
  tenantId: string;
  eventType: AnalyticsEventType;
  userId?: string;
  podcastId?: string;
  episodeId?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}
