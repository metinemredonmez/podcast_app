export const COMMENTS_REPOSITORY = Symbol('COMMENTS_REPOSITORY');

export interface CommentModel {
  id: string;
  tenantId: string;
  userId: string;
  episodeId: string;
  podcastId: string | null;
  parentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentWithUser extends CommentModel {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface CommentWithReplies extends CommentWithUser {
  replies: CommentWithUser[];
}

export interface CommentWithDetails extends CommentWithUser {
  episode: {
    id: string;
    title: string;
    slug: string;
    podcast: {
      id: string;
      title: string;
      slug: string;
    };
  };
  _count: {
    replies: number;
  };
}

export interface FindCommentsOptions {
  tenantId: string;
  episodeId?: string;
  podcastId?: string;
  userId?: string;
  parentId?: string | null;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

export interface FindAdminCommentsOptions extends FindCommentsOptions {
  search?: string;
}

export interface CreateCommentInput {
  tenantId: string;
  userId: string;
  episodeId: string;
  podcastId?: string | null;
  parentId?: string | null;
  content: string;
}

export interface UpdateCommentInput {
  content?: string;
}

export interface CommentsRepository {
  findById(id: string, tenantId: string): Promise<CommentWithReplies | null>;
  findMany(options: FindCommentsOptions): Promise<CommentWithReplies[]>;
  findManyAdmin(options: FindAdminCommentsOptions): Promise<CommentWithDetails[]>;
  count(options: FindCommentsOptions): Promise<number>;
  create(data: CreateCommentInput): Promise<CommentWithReplies>;
  update(id: string, tenantId: string, data: UpdateCommentInput): Promise<CommentWithReplies>;
  delete(id: string, tenantId: string): Promise<void>;
}
