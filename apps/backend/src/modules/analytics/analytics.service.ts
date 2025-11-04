import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsEvent, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { AnalyticsQueueService } from '../../jobs/queues/analytics.queue';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import { AnalyticsQueuePayload } from './interfaces/analytics-queue-payload.interface';

export interface AnalyticsStats {
  total: number;
  byEventType: Array<{
    eventType: string;
    count: number;
  }>;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: AnalyticsQueueService,
  ) {}

  private buildWhere(filter: FilterAnalyticsDto): Prisma.AnalyticsEventWhereInput {
    return {
      tenantId: filter.tenantId,
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.podcastId ? { podcastId: filter.podcastId } : {}),
      ...(filter.episodeId ? { episodeId: filter.episodeId } : {}),
      ...(filter.eventType ? { eventType: filter.eventType } : {}),
      ...(filter.from || filter.to
        ? {
            occurredAt: {
              ...(filter.from ? { gte: new Date(filter.from) } : {}),
              ...(filter.to ? { lte: new Date(filter.to) } : {}),
            },
          }
        : {}),
    };
  }

  async findAll(filter: FilterAnalyticsDto): Promise<AnalyticsEvent[]> {
    return this.prisma.analyticsEvent.findMany({
      where: this.buildWhere(filter),
      orderBy: { occurredAt: 'desc' },
      take: 2000,
    });
  }

  async findOne(tenantId: string, id: string): Promise<AnalyticsEvent> {
    const event = await this.prisma.analyticsEvent.findFirst({
      where: { id, tenantId },
    });
    if (!event) {
      throw new NotFoundException(`Analytics event ${id} not found.`);
    }
    return event;
  }

  async create(dto: CreateAnalyticsDto): Promise<AnalyticsEvent> {
    const data: Prisma.AnalyticsEventCreateInput = {
      tenantId: dto.tenantId,
      userId: dto.userId,
      podcastId: dto.podcastId,
      episodeId: dto.episodeId,
      eventType: dto.eventType,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
    };

    if (dto.metadata !== undefined) {
      data.metadata = dto.metadata as Prisma.JsonValue;
    }

    return this.prisma.analyticsEvent.create({ data });
  }

  async queueEvent(dto: CreateAnalyticsDto): Promise<void> {
    const payload: AnalyticsQueuePayload = {
      tenantId: dto.tenantId,
      eventType: dto.eventType,
      userId: dto.userId,
      podcastId: dto.podcastId,
      episodeId: dto.episodeId,
      metadata: dto.metadata,
      occurredAt: dto.occurredAt,
    };
    await this.queue.enqueue(payload);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const result = await this.prisma.analyticsEvent.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) {
      throw new NotFoundException(`Analytics event ${id} not found for tenant ${tenantId}.`);
    }
  }

  async getStats(filter: FilterAnalyticsDto): Promise<AnalyticsStats> {
    const where = this.buildWhere(filter);
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where,
      _count: { _all: true },
    });

    const total = grouped.reduce((sum, item) => sum + item._count._all, 0);
    const byEventType = grouped.map((item) => ({
      eventType: item.eventType,
      count: item._count._all,
    }));

    return { total, byEventType };
  }
}
