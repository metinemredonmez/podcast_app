export const EPISODES_REPOSITORY = Symbol('EPISODES_REPOSITORY');

export interface EpisodeModel {
  id: string;
  tenantId: string;
  podcastId: string;
  hostId: string | null;
  title: string;
  slug: string;
  description: string | null;
  duration: number;
  audioUrl: string;
  isPublished: boolean;
  publishedAt: Date | null;
  episodeNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationOptions {
  cursor?: string;
  limit: number;
  orderBy?: keyof EpisodeModel;
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
  findMany(options: PaginationOptions): Promise<EpisodeModel[]>;
  findById(id: string): Promise<EpisodeModel | null>;
  findBySlug(podcastId: string, slug: string): Promise<EpisodeModel | null>;
  create(payload: CreateEpisodeInput): Promise<EpisodeModel>;
  update(id: string, payload: UpdateEpisodeInput): Promise<EpisodeModel>;
}
