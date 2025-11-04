import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsEvent, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { AnalyticsQueueService } from '../../jobs/queues/analytics.queue';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import { AnalyticsQueuePayload } from './interfaces/analytics-queue-payload.interface';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';

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

  async findAll(filter: FilterAnalyticsDto, actor: JwtPayload): Promise<AnalyticsEvent[]> {
    const tenantId = this.resolveTenant(filter.tenantId, actor);
    return this.prisma.analyticsEvent.findMany({
      where: this.buildWhere({ ...filter, tenantId }),
      orderBy: { occurredAt: 'desc' },
      take: 2000,
    });
  }

  async findOne(tenantId: string, id: string, actor: JwtPayload): Promise<AnalyticsEvent> {
    const resolvedTenant = this.resolveTenant(tenantId, actor);
    const event = await this.prisma.analyticsEvent.findFirst({
      where: { id, tenantId: resolvedTenant },
    });
    if (!event) {
      throw new NotFoundException(`Analytics event ${id} not found.`);
    }
    return event;
  }

  async create(dto: CreateAnalyticsDto, actor: JwtPayload): Promise<AnalyticsEvent> {
    const tenantId = this.resolveTenant(dto.tenantId, actor);
    const data: Prisma.AnalyticsEventCreateInput = {
      tenantId,
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

  async queueEvent(dto: CreateAnalyticsDto, actor: JwtPayload): Promise<void> {
    const tenantId = this.resolveTenant(dto.tenantId, actor);
    const payload: AnalyticsQueuePayload = {
      tenantId,
      eventType: dto.eventType,
      userId: dto.userId,
      podcastId: dto.podcastId,
      episodeId: dto.episodeId,
      metadata: dto.metadata,
      occurredAt: dto.occurredAt,
    };
    await this.queue.enqueue(payload);
  }

  async remove(tenantId: string, id: string, actor: JwtPayload): Promise<void> {
    const resolvedTenant = this.resolveTenant(tenantId, actor);
    const result = await this.prisma.analyticsEvent.deleteMany({ where: { id, tenantId: resolvedTenant } });
    if (result.count === 0) {
      throw new NotFoundException(`Analytics event ${id} not found for tenant ${tenantId}.`);
    }
  }

  async getStats(filter: FilterAnalyticsDto, actor: JwtPayload): Promise<AnalyticsStats> {
    const tenantId = this.resolveTenant(filter.tenantId, actor);
    const where = this.buildWhere({ ...filter, tenantId });
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

  private resolveTenant(requestedTenantId: string, actor: JwtPayload): string {
    if (!requestedTenantId) {
      throw new ForbiddenException('tenantId is required for analytics operations.');
    }
    if (requestedTenantId === actor.tenantId) {
      return requestedTenantId;
    }
    if (actor.role === UserRole.ADMIN) {
      return requestedTenantId;
    }
    throw new ForbiddenException('Access to the requested tenant is not permitted.');
  }
}
