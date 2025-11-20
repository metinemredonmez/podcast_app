export const PODCASTS_REPOSITORY = Symbol('PODCASTS_REPOSITORY');

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
}

export interface PaginationOptions {
  tenantId: string;
  cursor?: string;
  limit: number;
  orderBy?: keyof PodcastModel;
  orderDirection?: 'asc' | 'desc';
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
}

export interface UpdatePodcastInput {
  title?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  categoryIds?: string[];
}

export interface PodcastsRepository {
  findMany(options: PaginationOptions): Promise<PodcastModel[]>;
  findDetailedById(id: string, tenantId: string): Promise<PodcastDetail | null>;
  findById(id: string, tenantId: string): Promise<PodcastModel | null>;
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
