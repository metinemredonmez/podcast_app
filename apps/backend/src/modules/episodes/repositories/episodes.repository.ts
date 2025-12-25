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
  audioUrl: string | null;
  audioMimeType: string | null;
  videoUrl: string | null;
  videoMimeType: string | null;
  youtubeUrl: string | null;
  externalVideoUrl: string | null;
  tags: string[];
  quality: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  isExplicit: boolean;
  isFeatured: boolean;
  episodeNumber: number | null;
  seasonNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
  podcast?: {
    id: string;
    title: string;
    coverImageUrl: string | null;
    mediaType: string | null;
  } | null;
}

export interface PaginationOptions {
  tenantId?: string;
  cursor?: string;
  limit: number;
  orderBy?: keyof EpisodeModel;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchEpisodesOptions extends PaginationOptions {
  search?: string;
  podcastId?: string;
  isPublished?: boolean;
}

export interface CreateEpisodeInput {
  tenantId: string;
  podcastId: string;
  hostId?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  duration: number;
  audioUrl?: string | null;
  audioMimeType?: string | null;
  videoUrl?: string | null;
  videoMimeType?: string | null;
  youtubeUrl?: string | null;
  externalVideoUrl?: string | null;
  tags?: string[];
  quality?: string | null;
  thumbnailUrl?: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  episodeNumber?: number | null;
  seasonNumber?: number | null;
  isFeatured?: boolean;
}

export interface UpdateEpisodeInput {
  title?: string;
  description?: string | null;
  duration?: number;
  audioUrl?: string;
  audioMimeType?: string | null;
  videoUrl?: string | null;
  videoMimeType?: string | null;
  youtubeUrl?: string | null;
  externalVideoUrl?: string | null;
  tags?: string[];
  quality?: string | null;
  thumbnailUrl?: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  episodeNumber?: number | null;
  seasonNumber?: number | null;
  isFeatured?: boolean;
}

export interface EpisodesRepository {
  findMany(options: PaginationOptions): Promise<EpisodeModel[]>;
  searchEpisodes(options: SearchEpisodesOptions): Promise<EpisodeModel[]>;
  findById(id: string, tenantId: string): Promise<EpisodeModel | null>;
  findBySlug(tenantId: string, podcastId: string, slug: string): Promise<EpisodeModel | null>;
  create(payload: CreateEpisodeInput): Promise<EpisodeModel>;
  update(id: string, tenantId: string, payload: UpdateEpisodeInput): Promise<EpisodeModel>;
  delete(id: string, tenantId: string): Promise<void>;
}
