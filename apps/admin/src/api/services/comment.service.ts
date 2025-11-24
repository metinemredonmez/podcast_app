import { apiClient } from '../client';

export interface CommentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface CommentEpisode {
  id: string;
  title: string;
  slug: string;
  podcast: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface Comment {
  id: string;
  tenantId: string;
  episodeId: string;
  userId: string;
  parentId?: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
  episode: CommentEpisode;
  _count: {
    replies: number;
  };
}

export interface CommentListResponse {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommentListParams {
  page?: number;
  limit?: number;
  search?: string;
  episodeId?: string;
  podcastId?: string;
}

export const commentService = {
  async list(params?: CommentListParams): Promise<CommentListResponse> {
    const response = await apiClient.get('/admin/comments', { params });
    return response.data;
  },

  async get(id: string): Promise<Comment> {
    const response = await apiClient.get(`/admin/comments/${id}`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/comments/${id}`);
  },
};

export default commentService;
