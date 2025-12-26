import { apiClient } from '../client';

export interface Episode {
  id: string;
  tenantId: string;
  podcastId: string;
  hostId?: string;
  title: string;
  slug: string;
  description?: string;
  duration: number;
  audioUrl?: string;
  audioMimeType?: string;
  // Video support
  videoUrl?: string;
  videoMimeType?: string;
  youtubeUrl?: string;
  externalVideoUrl?: string;
  // Content metadata
  tags?: string[];
  quality?: string;
  thumbnailUrl?: string;
  // Publication
  publishedAt?: string;
  isPublished: boolean;
  isExplicit: boolean;
  isFeatured: boolean;
  episodeNumber?: number;
  seasonNumber?: number;
  createdAt: string;
  updatedAt: string;
  // Joined data
  podcast?: {
    id: string;
    title: string;
    coverImageUrl?: string;
    mediaType?: 'AUDIO' | 'VIDEO';
  };
}

export interface EpisodeListResponse {
  data: Episode[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CreateEpisodeDto {
  title: string;
  description?: string;
  podcastId: string;
  // Audio support
  audioUrl?: string;
  audioMimeType?: string;
  // Video support
  videoUrl?: string;
  videoMimeType?: string;
  youtubeUrl?: string;
  externalVideoUrl?: string;
  // Content metadata
  duration?: number;
  tags?: string[];
  quality?: string;
  thumbnailUrl?: string;
  // Publication
  episodeNumber?: number;
  seasonNumber?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface UpdateEpisodeDto {
  title?: string;
  description?: string;
  audioUrl?: string;
  audioMimeType?: string;
  duration?: number;
  // Video support
  videoUrl?: string;
  videoMimeType?: string;
  youtubeUrl?: string;
  externalVideoUrl?: string;
  // Content metadata
  tags?: string[];
  quality?: string;
  thumbnailUrl?: string;
  // Publication
  isPublished?: boolean;
  publishedAt?: string;
  isFeatured?: boolean;
  episodeNumber?: number;
  seasonNumber?: number;
}

export const episodeService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    podcastId?: string;
    status?: string;
  }): Promise<EpisodeListResponse> {
    const response = await apiClient.get('/episodes', { params });
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      const paginated = payload as EpisodeListResponse & { page?: number; total?: number };
      if (paginated.hasMore !== undefined || paginated.nextCursor !== undefined || paginated.total !== undefined || paginated.page !== undefined) {
        return paginated;
      }
    }
    return (payload?.data ?? payload) as EpisodeListResponse;
  },

  async get(id: string): Promise<Episode> {
    const response = await apiClient.get(`/episodes/${id}`);
    return (response.data?.data ?? response.data) as Episode;
  },

  async create(data: CreateEpisodeDto): Promise<Episode> {
    const response = await apiClient.post('/episodes', data);
    return (response.data?.data ?? response.data) as Episode;
  },

  async update(id: string, data: UpdateEpisodeDto): Promise<Episode> {
    const response = await apiClient.patch(`/episodes/${id}`, data);
    return (response.data?.data ?? response.data) as Episode;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/episodes/${id}`);
  },

  async getByPodcast(podcastId: string): Promise<Episode[]> {
    const response = await apiClient.get(`/podcasts/${podcastId}/episodes`);
    return (response.data?.data ?? response.data) as Episode[];
  },
};
