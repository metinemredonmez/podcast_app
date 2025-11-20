import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PROGRESS_REPOSITORY, ProgressRepository } from './repositories/progress.repository';
import { ProgressResponseDto } from './dto/progress-response.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  RecentlyPlayedResponseDto,
  ContinueListeningResponseDto,
  CompletedEpisodesResponseDto,
  HistoryItemDto,
} from './dto/history-response.dto';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class ProgressService {
  constructor(
    @Inject(PROGRESS_REPOSITORY) private readonly progressRepository: ProgressRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(actor: JwtPayload): Promise<ProgressResponseDto[]> {
    const progresses = await this.progressRepository.findByUserId(actor.userId, actor.tenantId);
    return progresses.map((progress) => plainToInstance(ProgressResponseDto, progress));
  }

  async findOne(episodeId: string, actor: JwtPayload): Promise<ProgressResponseDto> {
    const progress = await this.progressRepository.findByUserAndEpisode(actor.userId, episodeId, actor.tenantId);
    if (!progress) {
      throw new NotFoundException(`Progress for episode ${episodeId} not found.`);
    }
    return plainToInstance(ProgressResponseDto, progress);
  }

  async upsert(episodeId: string, payload: UpdateProgressDto, actor: JwtPayload): Promise<ProgressResponseDto> {
    const existing = await this.progressRepository.findByUserAndEpisode(actor.userId, episodeId, actor.tenantId);

    let progress;
    if (existing) {
      // Update existing progress
      progress = await this.progressRepository.update(actor.userId, episodeId, actor.tenantId, {
        progressSeconds: payload.progressSeconds,
        completed: payload.completed ?? existing.completed,
      });
    } else {
      // Create new progress
      progress = await this.progressRepository.create({
        tenantId: actor.tenantId,
        userId: actor.userId,
        episodeId,
        progressSeconds: payload.progressSeconds,
        completed: payload.completed ?? false,
      });
    }

    return plainToInstance(ProgressResponseDto, progress);
  }

  async delete(episodeId: string, actor: JwtPayload): Promise<void> {
    const existing = await this.progressRepository.findByUserAndEpisode(actor.userId, episodeId, actor.tenantId);
    if (!existing) {
      throw new NotFoundException(`Progress for episode ${episodeId} not found.`);
    }

    await this.progressRepository.delete(actor.userId, episodeId, actor.tenantId);
  }

  // History Methods

  async getRecentlyPlayed(actor: JwtPayload, limit = 20): Promise<RecentlyPlayedResponseDto> {
    const progresses = await this.prisma.listeningProgress.findMany({
      where: {
        userId: actor.userId,
        tenantId: actor.tenantId,
      },
      include: {
        episode: {
          include: {
            podcast: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const items: HistoryItemDto[] = progresses.map((p) => ({
      id: p.id,
      episodeId: p.episodeId,
      progressSeconds: p.progressSeconds,
      progressPercentage: p.episode.duration > 0 ? Math.round((p.progressSeconds / p.episode.duration) * 100) : 0,
      completed: p.completed,
      lastPlayedAt: p.updatedAt,
      episode: {
        id: p.episode.id,
        title: p.episode.title,
        slug: p.episode.slug,
        duration: p.episode.duration,
        audioUrl: p.episode.audioUrl,
        coverImageUrl: p.episode.coverImageUrl ?? undefined,
        podcastId: p.episode.podcastId,
        podcastTitle: p.episode.podcast.title,
        podcastSlug: p.episode.podcast.slug,
      },
    }));

    return {
      items,
      total: items.length,
    };
  }

  async getContinueListening(actor: JwtPayload, limit = 20): Promise<ContinueListeningResponseDto> {
    const progresses = await this.prisma.listeningProgress.findMany({
      where: {
        userId: actor.userId,
        tenantId: actor.tenantId,
        completed: false,
        progressSeconds: { gt: 0 }, // Must have some progress
      },
      include: {
        episode: {
          include: {
            podcast: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const items: HistoryItemDto[] = progresses.map((p) => ({
      id: p.id,
      episodeId: p.episodeId,
      progressSeconds: p.progressSeconds,
      progressPercentage: p.episode.duration > 0 ? Math.round((p.progressSeconds / p.episode.duration) * 100) : 0,
      completed: p.completed,
      lastPlayedAt: p.updatedAt,
      episode: {
        id: p.episode.id,
        title: p.episode.title,
        slug: p.episode.slug,
        duration: p.episode.duration,
        audioUrl: p.episode.audioUrl,
        coverImageUrl: p.episode.coverImageUrl ?? undefined,
        podcastId: p.episode.podcastId,
        podcastTitle: p.episode.podcast.title,
        podcastSlug: p.episode.podcast.slug,
      },
    }));

    return {
      items,
      total: items.length,
    };
  }

  async getCompleted(actor: JwtPayload, limit = 50): Promise<CompletedEpisodesResponseDto> {
    const progresses = await this.prisma.listeningProgress.findMany({
      where: {
        userId: actor.userId,
        tenantId: actor.tenantId,
        completed: true,
      },
      include: {
        episode: {
          include: {
            podcast: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const items: HistoryItemDto[] = progresses.map((p) => ({
      id: p.id,
      episodeId: p.episodeId,
      progressSeconds: p.progressSeconds,
      progressPercentage: 100, // Always 100% for completed
      completed: p.completed,
      lastPlayedAt: p.updatedAt,
      episode: {
        id: p.episode.id,
        title: p.episode.title,
        slug: p.episode.slug,
        duration: p.episode.duration,
        audioUrl: p.episode.audioUrl,
        coverImageUrl: p.episode.coverImageUrl ?? undefined,
        podcastId: p.episode.podcastId,
        podcastTitle: p.episode.podcast.title,
        podcastSlug: p.episode.podcast.slug,
      },
    }));

    return {
      items,
      total: items.length,
    };
  }
}
