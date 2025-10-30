import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma.service';
import {
  CreateEpisodeInput,
  EpisodesRepository,
  PaginationOptions,
  UpdateEpisodeInput,
  EpisodeModel,
} from './episodes.repository';

@Injectable()
export class EpisodesPrismaRepository implements EpisodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(options: PaginationOptions): Promise<EpisodeModel[]> {
    const { cursor, limit, orderBy = 'publishedAt', orderDirection = 'desc' } = options;
    const rows = await this.prisma.episode.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { [orderBy]: orderDirection } as any,
    });
    return rows as unknown as EpisodeModel[];
  }

  async findById(id: string): Promise<EpisodeModel | null> {
    const episode = await this.prisma.episode.findUnique({ where: { id } });
    return episode as EpisodeModel | null;
  }

  async findBySlug(podcastId: string, slug: string): Promise<EpisodeModel | null> {
    const episode = await this.prisma.episode.findUnique({ where: { podcastId_slug: { podcastId, slug } } });
    return episode as EpisodeModel | null;
  }

  async create(payload: CreateEpisodeInput): Promise<EpisodeModel> {
    const created = await this.prisma.episode.create({
      data: payload,
    });
    return created as unknown as EpisodeModel;
  }

  async update(id: string, payload: UpdateEpisodeInput): Promise<EpisodeModel> {
    const updated = await this.prisma.episode.update({ where: { id }, data: payload });
    return updated as unknown as EpisodeModel;
  }
}
