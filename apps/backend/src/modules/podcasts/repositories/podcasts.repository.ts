import { Podcast } from '@prisma/client';

export const PODCASTS_REPOSITORY = Symbol('PODCASTS_REPOSITORY');

export interface PaginationOptions {
  cursor?: string;
  limit: number;
  orderBy?: keyof Podcast;
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

export interface PodcastsRepository {
  findMany(options: PaginationOptions): Promise<Podcast[]>;
  findDetailedById(id: string): Promise<PodcastDetail | null>;
  findById(id: string): Promise<Podcast | null>;
  findBySlug(tenantId: string, slug: string): Promise<Podcast | null>;
  create(payload: CreatePodcastInput): Promise<Podcast>;
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
