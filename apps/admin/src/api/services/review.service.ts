import { apiClient } from '../client';

export interface ReviewUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface ReviewPodcast {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string;
}

export interface Review {
  id: string;
  tenantId: string;
  userId: string;
  podcastId: string;
  rating: number;
  title?: string;
  content?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  podcast: ReviewPodcast;
  _count: {
    helpfulVotes: number;
  };
}

export interface ReviewListResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewListParams {
  page?: number;
  limit?: number;
  search?: string;
  podcastId?: string;
  rating?: number;
  isPublic?: boolean;
}

export const reviewService = {
  async list(params?: ReviewListParams): Promise<ReviewListResponse> {
    const response = await apiClient.get('/admin/reviews', { params });
    return response.data;
  },

  async get(id: string): Promise<Review> {
    const response = await apiClient.get(`/admin/reviews/${id}`);
    return response.data;
  },

  async updateVisibility(id: string, isPublic: boolean): Promise<Review> {
    const response = await apiClient.patch(`/admin/reviews/${id}/visibility`, { isPublic });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/reviews/${id}`);
  },
};

export default reviewService;
