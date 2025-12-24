export const PODCASTS_REPOSITORY = Symbol('PODCASTS_REPOSITORY');

export type MediaType = 'AUDIO' | 'VIDEO' | 'BOTH';
export type MediaQuality = 'SD' | 'HD' | 'FULL_HD' | 'UHD_4K';

export interface PodcastModel {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Media type and quality
  mediaType: MediaType;
  defaultQuality: MediaQuality;
  // Media fields
  audioUrl: string | null;
  audioMimeType: string | null;
  videoUrl: string | null;
  videoMimeType: string | null;
  youtubeUrl: string | null;
  externalVideoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number;
  // Metadata
  tags: string[];
  isFeatured: boolean;
}

export interface PaginationOptions {
  tenantId?: string;
  cursor?: string;
  limit: number;
  orderBy?: keyof PodcastModel;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchPodcastsOptions extends PaginationOptions {
  search?: string;
  categoryId?: string;
  ownerId?: string;
  isPublished?: boolean;
}

export interface CreatePodcastInput {
  tenantId: string;
  ownerId: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  categoryIds?: string[];
  // Media type and quality
  mediaType?: MediaType;
  defaultQuality?: MediaQuality;
  // Media fields
  audioUrl?: string | null;
  audioMimeType?: string | null;
  videoUrl?: string | null;
  videoMimeType?: string | null;
  youtubeUrl?: string | null;
  externalVideoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number;
  // Metadata
  tags?: string[];
  isFeatured?: boolean;
}

export interface UpdatePodcastInput {
  title?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  categoryIds?: string[];
  // Media type and quality
  mediaType?: MediaType;
  defaultQuality?: MediaQuality;
  // Media fields
  audioUrl?: string | null;
  audioMimeType?: string | null;
  videoUrl?: string | null;
  videoMimeType?: string | null;
  youtubeUrl?: string | null;
  externalVideoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number;
  // Metadata
  tags?: string[];
  isFeatured?: boolean;
}

export interface PodcastListItem extends PodcastModel {
  owner: { id: string; name: string | null };
  categories: Array<{ id: string; name: string; slug: string }>;
  _count: { episodes: number };
}

export interface PodcastsRepository {
  findMany(options: PaginationOptions): Promise<PodcastListItem[]>;
  searchPodcasts(options: SearchPodcastsOptions): Promise<PodcastListItem[]>;
  findDetailedById(id: string, tenantId: string): Promise<PodcastDetail | null>;
  findById(id: string, tenantId?: string): Promise<PodcastModel | null>;
  findBySlug(tenantId: string, slug: string): Promise<PodcastModel | null>;
  create(payload: CreatePodcastInput): Promise<PodcastModel>;
  update(id: string, tenantId: string, payload: UpdatePodcastInput): Promise<PodcastModel>;
  delete(id: string, tenantId: string): Promise<void>;
}

export interface PodcastDetail {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Media type and quality
  mediaType: MediaType;
  defaultQuality: MediaQuality;
  // Media fields
  audioUrl: string | null;
  audioMimeType: string | null;
  videoUrl: string | null;
  videoMimeType: string | null;
  youtubeUrl: string | null;
  externalVideoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number;
  // Metadata
  tags: string[];
  isFeatured: boolean;
  owner: {
    id: string;
    email: string;
    name: string | null;
  };
  episodes: Array<{
    id: string;
    title: string;
    slug: string;
    duration: number;
    isPublished: boolean;
    publishedAt: Date | null;
  }>;
  categories: Array<{ id: string; name: string; slug: string }>;
}
