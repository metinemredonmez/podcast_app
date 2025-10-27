import { apiClient } from '../client';

export const userService = {
  async list(params?: Record<string, unknown>) {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },
  async get(id: string) {
    const response = await apiClient.get('/users/' + id);
    return response.data;
  },
};
