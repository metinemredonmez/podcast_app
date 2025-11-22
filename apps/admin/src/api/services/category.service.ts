import { apiClient } from '../client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  podcastCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  data: Category[];
  total: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  icon?: string;
}

export const categoryService = {
  async list(): Promise<Category[]> {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  async get(id: string): Promise<Category> {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
