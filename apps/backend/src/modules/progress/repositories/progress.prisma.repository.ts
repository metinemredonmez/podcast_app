import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma.service';
import {
  CreateProgressInput,
  ProgressModel,
  ProgressRepository,
  ProgressWithEpisode,
  UpdateProgressInput,
} from './progress.repository';

@Injectable()
export class ProgressPrismaRepository implements ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string, tenantId: string): Promise<ProgressWithEpisode[]> {
    const progresses = await this.prisma.listeningProgress.findMany({
      where: { userId, tenantId },
      include: {
        episode: {
          select: {
            id: true,
            title: true,
            slug: true,
            duration: true,
            audioUrl: true,
            podcastId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return progresses as unknown as ProgressWithEpisode[];
  }

  async findByUserAndEpisode(userId: string, episodeId: string, tenantId: string): Promise<ProgressModel | null> {
    const progress = await this.prisma.listeningProgress.findUnique({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
        tenantId,
      },
    });

    return progress as ProgressModel | null;
  }

  async create(payload: CreateProgressInput): Promise<ProgressModel> {
    const progress = await this.prisma.listeningProgress.create({
      data: payload,
    });

    return progress as unknown as ProgressModel;
  }

  async update(
    userId: string,
    episodeId: string,
    tenantId: string,
    payload: UpdateProgressInput,
  ): Promise<ProgressModel> {
    const progress = await this.prisma.listeningProgress.update({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
        tenantId,
      },
      data: payload,
    });

    return progress as unknown as ProgressModel;
  }

  async delete(userId: string, episodeId: string, tenantId: string): Promise<void> {
    await this.prisma.listeningProgress.delete({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
        tenantId,
      },
    });
  }
}
