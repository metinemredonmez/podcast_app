import { apiClient } from '../client';

export const analyticService = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get('/analytics', { params });
    return response.data;
  },
  async get(id: string) {
    const response = await apiClient.get('/analytics/' + id);
    return response.data;
  },
};
