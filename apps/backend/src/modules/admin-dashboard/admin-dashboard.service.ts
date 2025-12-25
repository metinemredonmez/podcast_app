import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

const isAdminRole = (role: UserRole): boolean =>
  [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOCA].includes(role);

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(user: JwtPayload): Promise<DashboardStatsDto> {
    // Only ADMIN can access dashboard stats
    if (!isAdminRole(user.role)) {
      throw new ForbiddenException('Only administrators can access dashboard stats');
    }

    // Total users
    const totalUsers = await this.prisma.user.count();

    // Total podcasts
    const totalPodcasts = await this.prisma.podcast.count();

    // Total episodes
    const totalEpisodes = await this.prisma.episode.count();

    // Total plays
    const totalPlays = await this.prisma.analyticsEvent.count({
      where: { eventType: 'PODCAST_PLAY' },
    });

    // Total comments
    const totalComments = await this.prisma.comment.count();

    // Total follows
    const totalFollows = await this.prisma.follow.count();

    // Users by role
    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Recent users (last 10)
    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Recent podcasts (last 10)
    const recentPodcasts = await this.prisma.podcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        createdAt: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: { episodes: true },
        },
      },
    });

    // Growth metrics (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const usersLast30 = await this.prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const usersPrevious30 = await this.prisma.user.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });

    const podcastsLast30 = await this.prisma.podcast.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const podcastsPrevious30 = await this.prisma.podcast.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });

    const episodesLast30 = await this.prisma.episode.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const episodesPrevious30 = await this.prisma.episode.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalUsers,
      totalPodcasts,
      totalEpisodes,
      totalPlays,
      totalComments,
      totalFollows,
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count,
      })),
      recentUsers,
      recentPodcasts: recentPodcasts.map((p: any) => ({
        id: p.id,
        title: p.title,
        owner: p.owner,
        episodeCount: p._count.episodes,
        createdAt: p.createdAt,
      })),
      growthMetrics: {
        usersGrowth: calculateGrowth(usersLast30, usersPrevious30),
        podcastsGrowth: calculateGrowth(podcastsLast30, podcastsPrevious30),
        episodesGrowth: calculateGrowth(episodesLast30, episodesPrevious30),
      },
    };
  }
}
