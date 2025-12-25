import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';
import {
  CreatorOverviewDto,
  PodcastAnalyticsDto,
  EpisodeAnalyticsDto,
} from './dto/creator-analytics-response.dto';

@Injectable()
export class CreatorAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(user: JwtPayload): Promise<CreatorOverviewDto> {
    // Only CREATOR role can access this
    if (![UserRole.CREATOR, UserRole.ADMIN, UserRole.HOCA, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Only creators can access creator analytics');
    }

    // Get total podcasts
    const totalPodcasts = await this.prisma.podcast.count({
      where: { ownerId: user.userId },
    });

    // Get total episodes
    const totalEpisodes = await this.prisma.episode.count({
      where: {
        podcast: { ownerId: user.userId },
      },
    });

    // Get total plays from analytics events
    const playsCount = await this.prisma.analyticsEvent.count({
      where: {
        eventType: 'PODCAST_PLAY',
        podcast: { ownerId: user.userId },
      },
    });

    // Get total followers
    const totalFollowers = await this.prisma.follow.count({
      where: {
        podcast: { ownerId: user.userId },
      },
    });

    // Get average completion rate using aggregation instead of loading all records
    // This prevents memory issues with large datasets
    const completionStats = await this.prisma.$queryRaw<
      Array<{ avg_completion: number | null; total_count: bigint }>
    >`
      SELECT
        AVG(
          CASE
            WHEN e.duration > 0 THEN (lp."progressSeconds"::float / e.duration::float) * 100
            ELSE 0
          END
        ) as avg_completion,
        COUNT(*) as total_count
      FROM "ListeningProgress" lp
      INNER JOIN "Episode" e ON lp."episodeId" = e.id
      INNER JOIN "Podcast" p ON e."podcastId" = p.id
      WHERE p."ownerId" = ${user.userId}::text
    `;

    const avgCompletionRate = completionStats[0]?.avg_completion ?? 0;

    // Get total comments
    const totalComments = await this.prisma.comment.count({
      where: {
        episode: {
          podcast: { ownerId: user.userId },
        },
      },
    });

    return {
      totalPodcasts,
      totalEpisodes,
      totalPlays: playsCount,
      totalFollowers,
      avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
      totalComments,
    };
  }

  async getPodcastAnalytics(podcastId: string, user: JwtPayload): Promise<PodcastAnalyticsDto> {
    // Verify podcast ownership
    const podcast = await this.prisma.podcast.findUnique({
      where: { id: podcastId },
      select: { id: true, title: true, ownerId: true },
    });

    if (!podcast) {
      throw new NotFoundException('Podcast not found');
    }

    if (podcast.ownerId !== user.userId && ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('You do not have access to this podcast analytics');
    }

    // Total episodes
    const totalEpisodes = await this.prisma.episode.count({
      where: { podcastId },
    });

    // Total plays
    const totalPlays = await this.prisma.analyticsEvent.count({
      where: {
        eventType: 'PODCAST_PLAY',
        podcastId,
      },
    });

    // Unique listeners
    const uniqueListeners = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        eventType: 'PODCAST_PLAY',
        podcastId,
      },
      _count: true,
    });

    // Total followers
    const totalFollowers = await this.prisma.follow.count({
      where: { podcastId },
    });

    // Plays over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const playsOverTime = await this.prisma.analyticsEvent.groupBy({
      by: ['occurredAt'],
      where: {
        eventType: 'PODCAST_PLAY',
        podcastId,
        occurredAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: { occurredAt: 'asc' },
    });

    // Top episodes
    const topEpisodesData = await this.prisma.analyticsEvent.groupBy({
      by: ['episodeId'],
      where: {
        eventType: 'PODCAST_PLAY',
        podcastId,
        episodeId: { not: null },
      },
      _count: true,
      orderBy: { _count: { episodeId: 'desc' } },
      take: 5,
    });

    const topEpisodes = await Promise.all(
      topEpisodesData.map(async (item: any) => {
        const episode = await this.prisma.episode.findUnique({
          where: { id: item.episodeId! },
          select: { id: true, title: true, duration: true },
        });

        if (!episode) return null;

        // Calculate completion rate for this episode
        const progresses = await this.prisma.listeningProgress.findMany({
          where: { episodeId: episode.id },
          select: { currentTime: true },
        });

        let completionRate = 0;
        if (progresses.length > 0) {
          const totalCompletion = progresses.reduce((sum, p) => {
            return sum + (episode.duration > 0 ? (p.currentTime / episode.duration) * 100 : 0);
          }, 0);
          completionRate = totalCompletion / progresses.length;
        }

        return {
          episodeId: episode.id,
          title: episode.title,
          plays: item._count,
          completionRate: Math.round(completionRate * 100) / 100,
        };
      }),
    );

    return {
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      totalEpisodes,
      totalPlays,
      uniqueListeners: uniqueListeners.length,
      totalFollowers,
      playsOverTime: playsOverTime.map((item: any) => ({
        date: item.occurredAt.toISOString().split('T')[0],
        count: item._count,
      })),
      topEpisodes: topEpisodes.filter(Boolean) as any,
    };
  }

  async getEpisodeAnalytics(episodeId: string, user: JwtPayload): Promise<EpisodeAnalyticsDto> {
    // Verify episode ownership
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: {
        id: true,
        title: true,
        duration: true,
        podcast: {
          select: { ownerId: true },
        },
      },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    if (episode.podcast.ownerId !== user.userId && ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('You do not have access to this episode analytics');
    }

    // Total plays
    const totalPlays = await this.prisma.analyticsEvent.count({
      where: {
        eventType: 'PODCAST_PLAY',
        episodeId,
      },
    });

    // Unique listeners
    const uniqueListeners = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        eventType: 'PODCAST_PLAY',
        episodeId,
      },
      _count: true,
    });

    // Completion rate
    const progresses = await this.prisma.listeningProgress.findMany({
      where: { episodeId },
      select: { currentTime: true },
    });

    let completionRate = 0;
    let avgListeningTime = 0;
    if (progresses.length > 0) {
      const totalCompletion = progresses.reduce((sum, p) => {
        return sum + (episode.duration > 0 ? (p.currentTime / episode.duration) * 100 : 0);
      }, 0);
      completionRate = totalCompletion / progresses.length;

      const totalTime = progresses.reduce((sum, p) => sum + p.currentTime, 0);
      avgListeningTime = totalTime / progresses.length;
    }

    // Plays over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const playsOverTime = await this.prisma.analyticsEvent.groupBy({
      by: ['occurredAt'],
      where: {
        eventType: 'PODCAST_PLAY',
        episodeId,
        occurredAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: { occurredAt: 'asc' },
    });

    // Total comments
    const totalComments = await this.prisma.comment.count({
      where: { episodeId },
    });

    return {
      episodeId: episode.id,
      episodeTitle: episode.title,
      totalPlays,
      uniqueListeners: uniqueListeners.length,
      completionRate: Math.round(completionRate * 100) / 100,
      avgListeningTime: Math.round(avgListeningTime),
      playsOverTime: playsOverTime.map((item: any) => ({
        date: item.occurredAt.toISOString().split('T')[0],
        count: item._count,
      })),
      totalComments,
    };
  }

  async getTopPodcasts(
    user: JwtPayload,
    limit = 5,
  ): Promise<Array<{ id: string; title: string; plays: number; episodes: number; coverImageUrl?: string }>> {
    if (![UserRole.CREATOR, UserRole.ADMIN, UserRole.HOCA, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Only creators can access creator analytics');
    }

    const playsByPodcast = await this.prisma.analyticsEvent.groupBy({
      by: ['podcastId'],
      where: {
        eventType: 'PODCAST_PLAY',
        podcastId: { not: null },
        podcast: { ownerId: user.userId },
      },
      _count: { _all: true },
      orderBy: {
        _count: {
          podcastId: 'desc',
        },
      },
      take: limit,
    });

    const podcastIds = playsByPodcast.map((p) => p.podcastId).filter((id): id is string => id !== null);
    if (podcastIds.length === 0) {
      return [];
    }

    const podcasts = await this.prisma.podcast.findMany({
      where: { id: { in: podcastIds } },
      select: {
        id: true,
        title: true,
        coverImageUrl: true,
        _count: { select: { episodes: true } },
      },
    });

    const podcastMap = new Map(podcasts.map((p) => [p.id, p]));

    return playsByPodcast
      .filter((p) => p.podcastId)
      .map((p) => {
        const podcast = podcastMap.get(p.podcastId as string);
        return {
          id: p.podcastId as string,
          title: podcast?.title || 'Unknown',
          coverImageUrl: podcast?.coverImageUrl,
          plays: p._count._all,
          episodes: podcast?._count.episodes || 0,
        };
      });
  }
}
