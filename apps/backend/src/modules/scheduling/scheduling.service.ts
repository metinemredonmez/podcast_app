import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async scheduleEpisode(episodeId: string, scheduledAt: Date) {
    return this.prisma.scheduledEpisode.create({ data: { episodeId, scheduledAt } });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledEpisodes() {
    const now = new Date();
    const scheduled = await this.prisma.scheduledEpisode.findMany({
      where: { scheduledAt: { lte: now }, status: 'pending' },
      include: { episode: true },
    });

    for (const item of scheduled) {
      try {
        await this.prisma.episode.update({
          where: { id: item.episodeId },
          data: { isPublished: true, publishedAt: now },
        });
        await this.prisma.scheduledEpisode.update({
          where: { id: item.id },
          data: { status: 'published', publishedAt: now },
        });
      } catch (error) {
        await this.prisma.scheduledEpisode.update({
          where: { id: item.id },
          data: { status: 'failed' },
        });
      }
    }
  }

  async getScheduled() {
    return this.prisma.scheduledEpisode.findMany({
      where: { status: 'pending' },
      include: { episode: { include: { podcast: { select: { title: true } } } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
