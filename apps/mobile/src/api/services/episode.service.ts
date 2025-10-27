import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export const episode = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get(endpoints.episodes, { params });
    return response.data;
  },
  async get(id: string) {
    const response = await apiClient.get(endpoints.episodes + '/' + id);
    return response.data;
  },
};
