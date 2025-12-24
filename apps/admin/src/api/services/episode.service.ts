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
  };
}

export interface EpisodeListResponse {
  data: Episode[];
  total: number;
  page: number;
  limit: number;
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
    return response.data;
  },

  async get(id: string): Promise<Episode> {
    const response = await apiClient.get(`/episodes/${id}`);
    return response.data;
  },

  async create(data: CreateEpisodeDto): Promise<Episode> {
    const response = await apiClient.post('/episodes', data);
    return response.data;
  },

  async update(id: string, data: UpdateEpisodeDto): Promise<Episode> {
    const response = await apiClient.patch(`/episodes/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/episodes/${id}`);
  },

  async getByPodcast(podcastId: string): Promise<Episode[]> {
    const response = await apiClient.get(`/podcasts/${podcastId}/episodes`);
    return response.data;
  },
};
