import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export const auth = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get(endpoints.auth, { params });
    return response.data;
  },
  async get(id: string) {
    const response = await apiClient.get(endpoints.auth + '/' + id);
    return response.data;
  },
};
