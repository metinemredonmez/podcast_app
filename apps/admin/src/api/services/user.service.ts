import { apiClient } from '../client';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'creator' | 'user';
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  updatedAt: string;
  podcastCount?: number;
  episodeCount?: number;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: 'admin' | 'creator' | 'user';
  status?: 'active' | 'inactive' | 'banned';
}

export const userService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<UserListResponse> {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  async get(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  async changeRole(id: string, role: string): Promise<User> {
    const response = await apiClient.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  async ban(id: string): Promise<User> {
    const response = await apiClient.post(`/users/${id}/ban`);
    return response.data;
  },

  async unban(id: string): Promise<User> {
    const response = await apiClient.post(`/users/${id}/unban`);
    return response.data;
  },
};
