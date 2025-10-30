import { Episode } from '@prisma/client';

export const EPISODES_REPOSITORY = Symbol('EPISODES_REPOSITORY');

export interface PaginationOptions {
  cursor?: string;
  limit: number;
  orderBy?: keyof Episode;
  orderDirection?: 'asc' | 'desc';
}

export interface CreateEpisodeInput {
  tenantId: string;
  podcastId: string;
  hostId?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  duration: number;
  audioUrl: string;
  isPublished?: boolean;
  publishedAt?: Date | null;
  episodeNumber?: number | null;
}

export interface UpdateEpisodeInput {
  title?: string;
  description?: string | null;
  duration?: number;
  audioUrl?: string;
  isPublished?: boolean;
  publishedAt?: Date | null;
}

export interface EpisodesRepository {
  findMany(options: PaginationOptions): Promise<Episode[]>;
  findById(id: string): Promise<Episode | null>;
  findBySlug(podcastId: string, slug: string): Promise<Episode | null>;
  create(payload: CreateEpisodeInput): Promise<Episode>;
  update(id: string, payload: UpdateEpisodeInput): Promise<Episode>;
}
