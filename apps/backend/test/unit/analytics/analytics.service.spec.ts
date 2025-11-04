import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '../../../src/modules/analytics/analytics.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { AnalyticsQueueService } from '../../../src/jobs/queues/analytics.queue';
import { CreateAnalyticsDto } from '../../../src/modules/analytics/dto/create-analytics.dto';
import { FilterAnalyticsDto } from '../../../src/modules/analytics/dto/filter-analytics.dto';
import { AnalyticsEventType } from '../../../src/common/enums/prisma.enums';

describe('AnalyticsService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let queue: jest.Mocked<AnalyticsQueueService>;
  let service: AnalyticsService;

  beforeEach(() => {
    prisma = {
      analyticsEvent: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        groupBy: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    queue = {
      enqueue: jest.fn(),
    } as unknown as jest.Mocked<AnalyticsQueueService>;

    service = new AnalyticsService(prisma, queue);
  });

  it('creates analytics events via Prisma with optional metadata', async () => {
    const dto: CreateAnalyticsDto = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      eventType: AnalyticsEventType.PODCAST_PLAY,
      metadata: { duration: 30 },
      occurredAt: '2024-01-01T10:00:00.000Z',
    };
    const createdEvent = { id: 'event-1', ...dto } as any;
    prisma.analyticsEvent.create.mockResolvedValue(createdEvent);

    const result = await service.create(dto);

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        podcastId: undefined,
        episodeId: undefined,
        eventType: dto.eventType,
        metadata: dto.metadata,
        occurredAt: new Date(dto.occurredAt),
      },
    });
    expect(result).toBe(createdEvent);
  });

  it('enqueues analytics events for async ingestion', async () => {
    const dto: CreateAnalyticsDto = {
      tenantId: 'tenant-1',
      eventType: AnalyticsEventType.PODCAST_FOLLOW,
      metadata: { foo: 'bar' },
    };

    await service.queueEvent(dto);

    expect(queue.enqueue).toHaveBeenCalledWith({
      tenantId: dto.tenantId,
      eventType: dto.eventType,
      userId: undefined,
      podcastId: undefined,
      episodeId: undefined,
      metadata: dto.metadata,
      occurredAt: undefined,
    });
  });

  it('aggregates stats via Prisma groupBy', async () => {
    const filter: FilterAnalyticsDto = { tenantId: 'tenant-1' } as any;
    prisma.analyticsEvent.groupBy.mockResolvedValue([
      { eventType: AnalyticsEventType.PODCAST_PLAY, _count: { _all: 5 } },
      { eventType: AnalyticsEventType.PODCAST_FOLLOW, _count: { _all: 3 } },
    ] as any);

    const stats = await service.getStats(filter);

    expect(prisma.analyticsEvent.groupBy).toHaveBeenCalledWith({
      by: ['eventType'],
      where: expect.objectContaining({ tenantId: filter.tenantId }),
      _count: { _all: true },
    });
    expect(stats.total).toBe(8);
    expect(stats.byEventType).toEqual([
      { eventType: AnalyticsEventType.PODCAST_PLAY, count: 5 },
      { eventType: AnalyticsEventType.PODCAST_FOLLOW, count: 3 },
    ]);
  });

  it('removes analytics events and throws when missing', async () => {
    (prisma.analyticsEvent.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await expect(service.remove('tenant-1', 'event-1')).resolves.toBeUndefined();
    expect(prisma.analyticsEvent.deleteMany).toHaveBeenCalledWith({ where: { id: 'event-1', tenantId: 'tenant-1' } });

    (prisma.analyticsEvent.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    await expect(service.remove('tenant-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
