import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export const hoca = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get(endpoints.hocas, { params });
    return response.data;
  },
  async get(id: string) {
    const response = await apiClient.get(endpoints.hocas + '/' + id);
    return response.data;
  },
};
