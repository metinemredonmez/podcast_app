import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma.service';
import { ScheduleStatus } from '../../common/enums/prisma.enums';
import { ScheduleEpisodeDto } from './dto/schedule-episode.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async scheduleEpisode(dto: ScheduleEpisodeDto, userId: string) {
    // Check if episode is already scheduled
    const existing = await this.prisma.scheduledEpisode.findFirst({
      where: { episodeId: dto.episodeId, status: ScheduleStatus.PENDING },
    });

    if (existing) {
      throw new ConflictException('Episode is already scheduled for publishing');
    }

    // Verify episode exists and is not published
    const episode = await this.prisma.episode.findUnique({
      where: { id: dto.episodeId },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    if (episode.isPublished) {
      throw new ConflictException('Episode is already published');
    }

    return this.prisma.scheduledEpisode.create({
      data: {
        episodeId: dto.episodeId,
        scheduledAt: dto.scheduledAt,
        status: ScheduleStatus.PENDING,
      },
      include: {
        episode: { include: { podcast: { select: { id: true, title: true } } } },
      },
    });
  }

  async getScheduled(status?: ScheduleStatus) {
    return this.prisma.scheduledEpisode.findMany({
      where: status ? { status } : { status: ScheduleStatus.PENDING },
      include: {
        episode: { include: { podcast: { select: { id: true, title: true } } } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getById(id: string) {
    const scheduled = await this.prisma.scheduledEpisode.findUnique({
      where: { id },
      include: {
        episode: { include: { podcast: { select: { id: true, title: true } } } },
      },
    });

    if (!scheduled) {
      throw new NotFoundException('Scheduled episode not found');
    }

    return scheduled;
  }

  async update(id: string, dto: UpdateScheduleDto) {
    const scheduled = await this.getById(id);

    if (scheduled.status !== ScheduleStatus.PENDING) {
      throw new ConflictException('Cannot update a schedule that has already been processed');
    }

    return this.prisma.scheduledEpisode.update({
      where: { id },
      data: {
        ...(dto.scheduledAt && { scheduledAt: dto.scheduledAt }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        episode: { include: { podcast: { select: { id: true, title: true } } } },
      },
    });
  }

  async cancel(id: string) {
    const scheduled = await this.getById(id);

    if (scheduled.status !== ScheduleStatus.PENDING) {
      throw new ConflictException('Cannot cancel a schedule that has already been processed');
    }

    return this.prisma.scheduledEpisode.update({
      where: { id },
      data: { status: ScheduleStatus.CANCELLED },
    });
  }

  async delete(id: string) {
    await this.getById(id);
    await this.prisma.scheduledEpisode.delete({ where: { id } });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledEpisodes() {
    const now = new Date();
    const scheduled = await this.prisma.scheduledEpisode.findMany({
      where: { scheduledAt: { lte: now }, status: ScheduleStatus.PENDING },
      include: { episode: true },
    });

    for (const item of scheduled) {
      try {
        await this.prisma.$transaction([
          this.prisma.episode.update({
            where: { id: item.episodeId },
            data: { isPublished: true, publishedAt: now },
          }),
          this.prisma.scheduledEpisode.update({
            where: { id: item.id },
            data: { status: ScheduleStatus.PUBLISHED, publishedAt: now },
          }),
        ]);
        this.logger.log(`Published scheduled episode: ${item.episodeId}`);
      } catch (error) {
        this.logger.error(`Failed to publish scheduled episode: ${item.episodeId}`, error);
        await this.prisma.scheduledEpisode.update({
          where: { id: item.id },
          data: { status: ScheduleStatus.FAILED },
        });
      }
    }
  }
}
