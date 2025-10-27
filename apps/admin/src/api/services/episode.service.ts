import { apiClient } from '../client';

export const episodeService = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get('/episodes', { params });
    return response.data;
  },
  async get(id: string) {
    const response = await apiClient.get('/episodes/' + id);
    return response.data;
  },
};
