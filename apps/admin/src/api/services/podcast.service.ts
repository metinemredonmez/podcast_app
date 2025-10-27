import { apiClient } from '../client';

export const podcastService = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get('/podcasts', { params });
    return response.data;
  },
  async get(id: string) {
    const response = await apiClient.get('/podcasts/' + id);
    return response.data;
  },
};
