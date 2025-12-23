import { apiClient } from '../client';

export interface Hoca {
  id: string;
  tenantId: string;
  userId?: string;
  name: string;
  bio?: string;
  expertise?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface HocaListResponse {
  data: Hoca[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateHocaDto {
  name: string;
  bio?: string;
  expertise?: string;
  avatarUrl?: string;
}

export interface UpdateHocaDto {
  name?: string;
  bio?: string;
  expertise?: string;
  avatarUrl?: string;
}

export const hocaService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<HocaListResponse> {
    const response = await apiClient.get('/hocas', { params });
    return response.data;
  },

  async get(id: string): Promise<Hoca> {
    const response = await apiClient.get(`/hocas/${id}`);
    return response.data;
  },

  async create(data: CreateHocaDto): Promise<Hoca> {
    const response = await apiClient.post('/hocas', data);
    return response.data;
  },

  async update(id: string, data: UpdateHocaDto): Promise<Hoca> {
    const response = await apiClient.patch(`/hocas/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/hocas/${id}`);
  },
};
