import { apiClient } from '../client';

export interface FollowerRecord {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  podcast: {
    id: string;
    title: string;
    coverImageUrl?: string | null;
  };
}

export interface FollowersResponse {
  data: FollowerRecord[];
  total: number;
  page: number;
  limit: number;
}

export const followersService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    podcastId?: string;
  }): Promise<FollowersResponse> {
    const response = await apiClient.get('/follows/followers', { params });
    return response.data as FollowersResponse;
  },
};
