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
    const { tenantId, cursor, limit, orderBy = 'publishedAt', orderDirection = 'desc' } = options;
    const rows = await this.prisma.episode.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: { tenantId },
      orderBy: { [orderBy]: orderDirection } as any,
    });
    return rows as unknown as EpisodeModel[];
  }

  async findById(id: string, tenantId: string): Promise<EpisodeModel | null> {
    const episode = await this.prisma.episode.findFirst({ where: { id, tenantId } });
    return episode as EpisodeModel | null;
  }

  async findBySlug(tenantId: string, podcastId: string, slug: string): Promise<EpisodeModel | null> {
    const episode = await this.prisma.episode.findFirst({ where: { tenantId, podcastId, slug } });
    return episode as EpisodeModel | null;
  }

  async create(payload: CreateEpisodeInput): Promise<EpisodeModel> {
    const created = await this.prisma.episode.create({
      data: payload,
    });
    return created as unknown as EpisodeModel;
  }

  async update(id: string, tenantId: string, payload: UpdateEpisodeInput): Promise<EpisodeModel> {
    const existing = await this.prisma.episode.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new Error(`Episode ${id} not found within tenant ${tenantId}`);
    }
    const updated = await this.prisma.episode.update({ where: { id }, data: payload });
    return updated as unknown as EpisodeModel;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.episode.delete({
      where: { id, tenantId },
    });
  }
}
