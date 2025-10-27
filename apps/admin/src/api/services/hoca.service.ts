import { apiClient } from '../client';

export const hocaService = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get('/hocas', { params });
    return response.data;
  },
  async get(id: string) {
    const response = await apiClient.get('/hocas/' + id);
    return response.data;
  },
};
