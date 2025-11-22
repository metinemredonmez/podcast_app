import { apiClient } from '../client';

export interface Podcast {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  author: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  episodeCount: number;
  totalPlays: number;
  createdAt: string;
  updatedAt: string;
}

export interface PodcastListResponse {
  data: Podcast[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePodcastDto {
  title: string;
  description: string;
  coverImage?: string;
  categoryId: string;
}

export interface UpdatePodcastDto {
  title?: string;
  description?: string;
  coverImage?: string;
  categoryId?: string;
  status?: 'draft' | 'published' | 'archived';
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
    return response.data;
  },

  async get(id: string): Promise<Podcast> {
    const response = await apiClient.get(`/podcasts/${id}`);
    return response.data;
  },

  async create(data: CreatePodcastDto): Promise<Podcast> {
    const response = await apiClient.post('/podcasts', data);
    return response.data;
  },

  async update(id: string, data: UpdatePodcastDto): Promise<Podcast> {
    const response = await apiClient.patch(`/podcasts/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/podcasts/${id}`);
  },

  async search(query: string): Promise<Podcast[]> {
    const response = await apiClient.get('/podcasts/search', { params: { q: query } });
    return response.data;
  },
};
