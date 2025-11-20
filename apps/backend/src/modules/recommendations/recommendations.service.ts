import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getForYou(userId: string, limit = 10) {
    // Collaborative filtering based on user's listening history
    const userProgress = await this.prisma.listeningProgress.findMany({
      where: { userId },
      select: { episode: { select: { podcastId: true } } },
      take: 50,
    });
    
    const podcastIds = [...new Set(userProgress.map(p => p.episode.podcastId))];
    
    // Find similar users who listened to same podcasts
    const similarUsers = await this.prisma.listeningProgress.findMany({
      where: { episode: { podcastId: { in: podcastIds } }, userId: { not: userId } },
      select: { userId: true },
      distinct: ['userId'],
      take: 20,
    });

    // Get podcasts these similar users listened to
    const recommendations = await this.prisma.listeningProgress.findMany({
      where: {
        userId: { in: similarUsers.map(u => u.userId) },
        episode: { podcastId: { notIn: podcastIds } },
      },
      select: { episode: { select: { podcast: true } } },
      distinct: ['episodeId'],
      take: limit,
    });

    return recommendations.map(r => r.episode.podcast);
  }

  async getSimilar(podcastId: string, limit = 10) {
    const podcast = await this.prisma.podcast.findUnique({
      where: { id: podcastId },
      include: { categories: { include: { category: true } } },
    });

    if (!podcast) return [];

    const categoryIds = podcast.categories.map(c => c.categoryId);

    return this.prisma.podcast.findMany({
      where: {
        id: { not: podcastId },
        categories: { some: { categoryId: { in: categoryIds } } },
        isPublished: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTrending(limit = 10) {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const topPodcasts = await this.prisma.analyticsEvent.groupBy({
      by: ['podcastId'],
      where: {
        eventType: 'PODCAST_PLAY',
        occurredAt: { gte: lastWeek },
        podcastId: { not: null },
      },
      _count: true,
      orderBy: { _count: { podcastId: 'desc' } },
      take: limit,
    });

    const podcastIds = topPodcasts.map(p => p.podcastId!);
    return this.prisma.podcast.findMany({ where: { id: { in: podcastIds } } });
  }
}
