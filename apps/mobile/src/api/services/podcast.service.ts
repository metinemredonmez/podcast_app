import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export const podcast = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get(endpoints.podcasts, { params });
    return response.data;
  },
  async get(id: string) {
    const response = await apiClient.get(endpoints.podcasts + '/' + id);
    return response.data;
  },
};
