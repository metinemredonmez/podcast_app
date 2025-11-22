import { apiClient } from '../client';

export interface Episode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number;
  podcastId: string;
  podcastTitle: string;
  episodeNumber: number;
  status: 'draft' | 'published' | 'scheduled';
  publishDate?: string;
  plays: number;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeListResponse {
  data: Episode[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateEpisodeDto {
  title: string;
  description: string;
  audioUrl: string;
  podcastId: string;
  episodeNumber?: number;
  publishDate?: string;
}

export interface UpdateEpisodeDto {
  title?: string;
  description?: string;
  audioUrl?: string;
  status?: 'draft' | 'published' | 'scheduled';
  publishDate?: string;
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
