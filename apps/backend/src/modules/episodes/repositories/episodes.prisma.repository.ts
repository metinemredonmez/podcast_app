import { Injectable } from '@nestjs/common';
import { Episode } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma.service';
import {
  CreateEpisodeInput,
  EpisodesRepository,
  PaginationOptions,
  UpdateEpisodeInput,
} from './episodes.repository';

@Injectable()
export class EpisodesPrismaRepository implements EpisodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(options: PaginationOptions): Promise<Episode[]> {
    const { cursor, limit, orderBy = 'publishedAt', orderDirection = 'desc' } = options;
    return this.prisma.episode.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { [orderBy]: orderDirection },
    });
  }

  findById(id: string): Promise<Episode | null> {
    return this.prisma.episode.findUnique({ where: { id } });
  }

  findBySlug(podcastId: string, slug: string): Promise<Episode | null> {
    return this.prisma.episode.findUnique({ where: { podcastId_slug: { podcastId, slug } } });
  }

  create(payload: CreateEpisodeInput): Promise<Episode> {
    return this.prisma.episode.create({
      data: payload,
    });
  }

  update(id: string, payload: UpdateEpisodeInput): Promise<Episode> {
    return this.prisma.episode.update({ where: { id }, data: payload });
  }
}
