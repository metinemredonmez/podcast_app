import { apiClient } from '../client';

export interface Podcast {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Media type and quality
  mediaType?: 'AUDIO' | 'VIDEO';
  defaultQuality?: 'SD' | 'HD' | 'FULL_HD' | 'UHD_4K';
  // Media fields
  audioUrl?: string;
  audioMimeType?: string;
  videoUrl?: string;
  videoMimeType?: string;
  youtubeUrl?: string;
  externalVideoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  // Metadata
  tags?: string[];
  isFeatured?: boolean;
  // Relations (from detail endpoint)
  categories?: { id: string; name: string; slug: string }[];
  owner?: { id: string; name: string };
  _count?: { episodes: number };
}

export interface PodcastDetail extends Podcast {
  episodes?: {
    id: string;
    title: string;
    slug: string;
    duration?: number;
    isPublished: boolean;
    publishedAt?: string;
  }[];
}

export interface PodcastListResponse {
  data: Podcast[];
  nextCursor?: string;
  hasMore: boolean;
}

export type MediaType = 'AUDIO' | 'VIDEO';
export type MediaQuality = 'SD' | 'HD' | 'FULL_HD' | 'UHD_4K';

export interface CreatePodcastDto {
  title: string;
  description?: string;
  coverImageUrl?: string;
  categoryId?: string;
  categoryIds?: string[];
  mediaType?: MediaType;
  defaultQuality?: MediaQuality;
  // Media fields
  audioUrl?: string;
  audioMimeType?: string;
  videoUrl?: string;
  videoMimeType?: string;
  youtubeUrl?: string;
  externalVideoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  // Metadata
  tags?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface UpdatePodcastDto {
  title?: string;
  description?: string;
  slug?: string;
  coverImageUrl?: string;
  categoryId?: string;
  categoryIds?: string[];
  mediaType?: MediaType;
  defaultQuality?: MediaQuality;
  // Media fields
  audioUrl?: string;
  audioMimeType?: string;
  videoUrl?: string;
  videoMimeType?: string;
  youtubeUrl?: string;
  externalVideoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  // Metadata
  tags?: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
}

export const podcastService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }): Promise<PodcastListResponse> {
    const response = await apiClient.get('/podcasts', { params });
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      const paginated = payload as PodcastListResponse & { page?: number; total?: number };
      if (paginated.hasMore !== undefined || paginated.nextCursor !== undefined || paginated.total !== undefined || paginated.page !== undefined) {
        return paginated;
      }
    }
    return (payload?.data ?? payload) as PodcastListResponse;
  },

  async get(id: string): Promise<Podcast> {
    const response = await apiClient.get(`/podcasts/${id}`);
    return (response.data?.data ?? response.data) as Podcast;
  },

  async getById(id: string): Promise<PodcastDetail> {
    const response = await apiClient.get(`/podcasts/${id}`);
    return (response.data?.data ?? response.data) as PodcastDetail;
  },

  async create(data: CreatePodcastDto): Promise<Podcast> {
    const response = await apiClient.post('/podcasts', data);
    return (response.data?.data ?? response.data) as Podcast;
  },

  async update(id: string, data: UpdatePodcastDto): Promise<Podcast> {
    const response = await apiClient.patch(`/podcasts/${id}`, data);
    return (response.data?.data ?? response.data) as Podcast;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/podcasts/${id}`);
  },

  async search(query: string): Promise<Podcast[]> {
    const response = await apiClient.get('/podcasts/search', { params: { q: query } });
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      const paginated = payload as PodcastListResponse & { page?: number; total?: number };
      if (paginated.hasMore !== undefined || paginated.nextCursor !== undefined || paginated.total !== undefined || paginated.page !== undefined) {
        return paginated.data ?? [];
      }
    }
    return (payload?.data ?? payload) as Podcast[];
  },
};
