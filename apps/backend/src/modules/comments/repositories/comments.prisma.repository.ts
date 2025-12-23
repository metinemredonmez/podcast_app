import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma.service';
import {
  CommentsRepository,
  CommentWithReplies,
  CommentWithDetails,
  FindCommentsOptions,
  FindAdminCommentsOptions,
  CreateCommentInput,
  UpdateCommentInput,
} from './comments.repository';

const commentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  replies: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.CommentInclude;

const adminInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  },
  episode: {
    select: {
      id: true,
      title: true,
      slug: true,
      podcast: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  },
  _count: {
    select: { replies: true },
  },
} satisfies Prisma.CommentInclude;

@Injectable()
export class CommentsPrismaRepository implements CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<CommentWithReplies | null> {
    const comment = await this.prisma.comment.findFirst({
      where: { id, tenantId },
      include: commentInclude,
    });
    return comment as CommentWithReplies | null;
  }

  async findMany(options: FindCommentsOptions): Promise<CommentWithReplies[]> {
    const {
      tenantId,
      episodeId,
      podcastId,
      userId,
      parentId = null,
      page = 1,
      limit = 20,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    } = options;

    const where: Prisma.CommentWhereInput = {
      tenantId,
      parentId,
      ...(episodeId && { episodeId }),
      ...(podcastId && { podcastId }),
      ...(userId && { userId }),
    };

    const comments = await this.prisma.comment.findMany({
      where,
      orderBy: { [orderBy]: orderDirection },
      skip: (page - 1) * limit,
      take: limit,
      include: commentInclude,
    });

    return comments as CommentWithReplies[];
  }

  async findManyAdmin(options: FindAdminCommentsOptions): Promise<CommentWithDetails[]> {
    const {
      tenantId,
      episodeId,
      podcastId,
      search,
      page = 1,
      limit = 20,
      orderDirection = 'desc',
    } = options;

    const where: Prisma.CommentWhereInput = {
      tenantId,
      parentId: null, // Only top-level comments
      ...(episodeId && { episodeId }),
      ...(podcastId && { episode: { podcastId } }),
      ...(search && {
        OR: [
          { content: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const comments = await this.prisma.comment.findMany({
      where,
      orderBy: { createdAt: orderDirection },
      skip: (page - 1) * limit,
      take: limit,
      include: adminInclude,
    });

    return comments as CommentWithDetails[];
  }

  async count(options: FindCommentsOptions): Promise<number> {
    const { tenantId, episodeId, podcastId, userId, parentId = null } = options;

    const where: Prisma.CommentWhereInput = {
      tenantId,
      parentId,
      ...(episodeId && { episodeId }),
      ...(podcastId && { podcastId }),
      ...(userId && { userId }),
    };

    return this.prisma.comment.count({ where });
  }

  async create(data: CreateCommentInput): Promise<CommentWithReplies> {
    const comment = await this.prisma.comment.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        episodeId: data.episodeId,
        podcastId: data.podcastId ?? null,
        parentId: data.parentId ?? null,
        content: data.content,
      },
      include: commentInclude,
    });

    return comment as CommentWithReplies;
  }

  async update(id: string, tenantId: string, data: UpdateCommentInput): Promise<CommentWithReplies> {
    const comment = await this.prisma.comment.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content }),
      },
      include: commentInclude,
    });

    return comment as CommentWithReplies;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }
}
