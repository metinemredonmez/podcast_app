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

  async getDashboardStats(actor: JwtPayload): Promise<{
    totalPodcasts: number;
    totalEpisodes: number;
    totalUsers: number;
    totalPlays: number;
    podcastsGrowth: number;
    episodesGrowth: number;
    usersGrowth: number;
    playsGrowth: number;
  }> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access dashboard stats');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [totalPodcasts, totalEpisodes, totalUsers] = await Promise.all([
      this.prisma.podcast.count(),
      this.prisma.episode.count(),
      this.prisma.user.count(),
    ]);

    const totalPlays = await this.prisma.analyticsEvent.count({
      where: { eventType: 'PODCAST_PLAY' },
    });

    const [podcastsLast30, podcastsPrevious30, episodesLast30, episodesPrevious30, usersLast30, usersPrevious30] =
      await Promise.all([
        this.prisma.podcast.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        this.prisma.podcast.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        this.prisma.episode.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        this.prisma.episode.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        this.prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      ]);

    const playsLast30 = await this.prisma.analyticsEvent.count({
      where: { eventType: 'PODCAST_PLAY', occurredAt: { gte: thirtyDaysAgo } },
    });

    const playsPrevious30 = await this.prisma.analyticsEvent.count({
      where: { eventType: 'PODCAST_PLAY', occurredAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    return {
      totalPodcasts,
      totalEpisodes,
      totalUsers,
      totalPlays,
      podcastsGrowth: calculateGrowth(podcastsLast30, podcastsPrevious30),
      episodesGrowth: calculateGrowth(episodesLast30, episodesPrevious30),
      usersGrowth: calculateGrowth(usersLast30, usersPrevious30),
      playsGrowth: calculateGrowth(playsLast30, playsPrevious30),
    };
  }

  async getTopPodcasts(
    limit: number,
    actor: JwtPayload,
  ): Promise<Array<{ id: string; title: string; plays: number; episodes: number }>> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access top podcasts');
    }

    // Get play counts per podcast
    const playsByPodcast = await this.prisma.analyticsEvent.groupBy({
      by: ['podcastId'],
      where: {
        eventType: 'PODCAST_PLAY',
        podcastId: { not: null },
      },
      _count: { _all: true },
      orderBy: {
        _count: {
          podcastId: 'desc'
        }
      },
      take: limit,
    });

    // Get podcast details
    const podcastIds = playsByPodcast.map((p) => p.podcastId).filter((id): id is string => id !== null);

    const podcasts = await this.prisma.podcast.findMany({
      where: { id: { in: podcastIds } },
      include: {
        _count: {
          select: { episodes: true },
        },
      },
    });

    const podcastMap = new Map(podcasts.map((p) => [p.id, p]));

    return playsByPodcast.map((play) => {
      const podcast = podcastMap.get(play.podcastId!);
      return {
        id: play.podcastId!,
        title: podcast?.title || 'Unknown',
        plays: play._count._all,
        episodes: podcast?._count.episodes || 0,
      };
    });
  }

  async getKPIs(
    from: string,
    to: string,
    actor: JwtPayload,
  ): Promise<{
    totalPlays: number;
    uniqueListeners: number;
    avgListenDuration: number;
    completionRate: number;
    newSubscribers: number;
    playsChange: number;
    listenersChange: number;
    durationChange: number;
    completionChange: number;
    subscribersChange: number;
  }> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access analytics');
    }

    // Current period stats
    const currentPlays = await this.prisma.analyticsEvent.count({
      where: {
        eventType: 'PODCAST_PLAY',
        occurredAt: { gte: new Date(from), lte: new Date(to) },
      },
    });

    const uniqueListeners = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'PODCAST_PLAY',
        occurredAt: { gte: new Date(from), lte: new Date(to) },
      },
      select: { userId: true },
      distinct: ['userId'],
    }).then((users) => users.length);

    const newUsers = await this.prisma.user.count({
      where: {
        createdAt: { gte: new Date(from), lte: new Date(to) },
      },
    });

    // Mock data for now (would need listening progress data for real calculations)
    const avgListenDuration = 1200; // 20 minutes in seconds
    const completionRate = 75;

    // Previous period for comparison
    const periodLength = new Date(to).getTime() - new Date(from).getTime();
    const previousFrom = new Date(new Date(from).getTime() - periodLength);
    const previousTo = new Date(from);

    const previousPlays = await this.prisma.analyticsEvent.count({
      where: {
        eventType: 'PODCAST_PLAY',
        occurredAt: { gte: previousFrom, lte: previousTo },
      },
    });

    const playsChange = previousPlays > 0 ? ((currentPlays - previousPlays) / previousPlays) * 100 : 0;

    return {
      totalPlays: currentPlays,
      uniqueListeners,
      avgListenDuration,
      completionRate,
      newSubscribers: newUsers,
      playsChange: Math.round(playsChange * 10) / 10,
      listenersChange: 0, // Would need historical data
      durationChange: 0,
      completionChange: 0,
      subscribersChange: 0,
    };
  }

  async getPlaysOverTime(
    from: string,
    to: string,
    groupBy: 'hour' | 'day' | 'week' | 'month',
    actor: JwtPayload,
  ): Promise<Array<{ timestamp: string; value: number }>> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access analytics');
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'PODCAST_PLAY',
        occurredAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      select: { occurredAt: true },
      orderBy: { occurredAt: 'asc' },
    });

    // Group by date
    const grouped = new Map<string, number>();
    events.forEach((event) => {
      const date = event.occurredAt.toISOString().split('T')[0]; // Group by day for now
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([timestamp, value]) => ({
      timestamp,
      value,
    }));
  }

  async getUserGrowth(
    from: string,
    to: string,
    actor: JwtPayload,
  ): Promise<Array<{ timestamp: string; value: number }>> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access analytics');
    }

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped = new Map<string, number>();
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([timestamp, value]) => ({
      timestamp,
      value,
    }));
  }

  async getDeviceBreakdown(actor: JwtPayload): Promise<Array<{ device: string; count: number; percentage: number }>> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access analytics');
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where: { eventType: 'PODCAST_PLAY' },
      select: { metadata: true },
    });

    const deviceCounts = new Map<string, number>();
    let total = 0;

    events.forEach((event) => {
      const device = (event.metadata as any)?.device || 'unknown';
      deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
      total++;
    });

    return Array.from(deviceCounts.entries()).map(([device, count]) => ({
      device,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
    }));
  }

  async getGeography(actor: JwtPayload): Promise<Array<{ country: string; countryCode: string; count: number; percentage: number }>> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access analytics');
    }

    // Mock data for now - would need IP geolocation in production
    return [
      { country: 'Turkey', countryCode: 'TR', count: 1500, percentage: 60 },
      { country: 'Germany', countryCode: 'DE', count: 500, percentage: 20 },
      { country: 'United States', countryCode: 'US', count: 300, percentage: 12 },
      { country: 'United Kingdom', countryCode: 'GB', count: 200, percentage: 8 },
    ];
  }

  async getPeakListeningHours(actor: JwtPayload): Promise<Array<{ hour: number; count: number }>> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access analytics');
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where: { eventType: 'PODCAST_PLAY' },
      select: { occurredAt: true },
    });

    const hourCounts = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourCounts.set(i, 0);
    }

    events.forEach((event) => {
      const hour = event.occurredAt.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    return Array.from(hourCounts.entries()).map(([hour, count]) => ({
      hour,
      count,
    }));
  }

  async exportData(
    from: string,
    to: string,
    actor: JwtPayload,
  ): Promise<{
    summary: any;
    dailyStats: any[];
    topPodcasts: any[];
  }> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can export analytics');
    }

    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Fetch all data in bulk queries instead of per-day queries
    const [allPlays, allUsers, allComments, allReviews, topPodcasts] = await Promise.all([
      // Get all plays in date range
      this.prisma.analyticsEvent.findMany({
        where: {
          eventType: 'PODCAST_PLAY',
          occurredAt: { gte: fromDate, lte: toDate },
        },
        select: { occurredAt: true, userId: true },
      }),
      // Get all new users in date range
      this.prisma.user.findMany({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        select: { createdAt: true },
      }),
      // Get all comments in date range
      this.prisma.comment.findMany({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        select: { createdAt: true },
      }),
      // Get all reviews in date range
      this.prisma.review.findMany({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        select: { createdAt: true },
      }),
      // Get top podcasts
      this.getTopPodcasts(10, actor),
    ]);

    // Group data by date in memory
    const dayMap = new Map<string, { plays: number; uniqueListeners: Set<string>; newUsers: number; comments: number; reviews: number }>();

    // Initialize all days in the range
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dayMap.set(dateKey, { plays: 0, uniqueListeners: new Set(), newUsers: 0, comments: 0, reviews: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate plays
    for (const play of allPlays) {
      const dateKey = play.occurredAt.toISOString().split('T')[0];
      const day = dayMap.get(dateKey);
      if (day) {
        day.plays++;
        if (play.userId) day.uniqueListeners.add(play.userId);
      }
    }

    // Aggregate users
    for (const user of allUsers) {
      const dateKey = user.createdAt.toISOString().split('T')[0];
      const day = dayMap.get(dateKey);
      if (day) day.newUsers++;
    }

    // Aggregate comments
    for (const comment of allComments) {
      const dateKey = comment.createdAt.toISOString().split('T')[0];
      const day = dayMap.get(dateKey);
      if (day) day.comments++;
    }

    // Aggregate reviews
    for (const review of allReviews) {
      const dateKey = review.createdAt.toISOString().split('T')[0];
      const day = dayMap.get(dateKey);
      if (day) day.reviews++;
    }

    // Convert to array
    const days = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        plays: data.plays,
        uniqueListeners: data.uniqueListeners.size,
        newUsers: data.newUsers,
        comments: data.comments,
        reviews: data.reviews,
      }));

    // Summary
    const totalPlays = days.reduce((sum, d) => sum + d.plays, 0);
    const totalNewUsers = days.reduce((sum, d) => sum + d.newUsers, 0);
    const totalComments = days.reduce((sum, d) => sum + d.comments, 0);
    const totalReviews = days.reduce((sum, d) => sum + d.reviews, 0);

    return {
      summary: {
        period: { from, to },
        totalPlays,
        totalNewUsers,
        totalComments,
        totalReviews,
      },
      dailyStats: days,
      topPodcasts,
    };
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
