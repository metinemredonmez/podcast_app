import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ListCommentsDto } from './dto/list-comments.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import { UserRole } from '../../common/enums/prisma.enums';

interface CommentActorContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

const commentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  replies: {
    orderBy: { createdAt: 'asc' },
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

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ListCommentsDto) {
    const where: Prisma.CommentWhereInput = {
      tenantId: filter.tenantId,
      parentId: null,
      ...(filter.episodeId ? { episodeId: filter.episodeId } : {}),
      ...(filter.podcastId ? { podcastId: filter.podcastId } : {}),
      ...(filter.userId ? { userId: filter.userId } : {}),
    };

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: commentInclude,
    });
  }

  async findOne(tenantId: string, id: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, tenantId },
      include: commentInclude,
    });
    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found.`);
    }
    return comment;
  }

  async create(dto: CreateCommentDto, actor: CommentActorContext) {
    const tenantId = dto.tenantId ?? actor.tenantId;
    this.ensureTenantAccess(tenantId, actor);
    const userId = actor.userId;

    let parentId: string | null = dto.parentId ?? null;
    let episodeId = dto.episodeId;
    let podcastId = dto.podcastId ?? null;

    if (parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: parentId, tenantId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent comment ${parentId} not found.`);
      }
      episodeId = parent.episodeId;
      podcastId = parent.podcastId;
    }

    const data: Prisma.CommentUncheckedCreateInput = {
      tenantId,
      userId,
      episodeId,
      podcastId,
      parentId,
      content: dto.content,
    };

    const comment = await this.prisma.comment.create({
      data,
      include: commentInclude,
    });
    return comment;
  }

  async reply(parentId: string, dto: ReplyCommentDto, actor: CommentActorContext) {
    const tenantId = dto.tenantId ?? actor.tenantId;
    this.ensureTenantAccess(tenantId, actor);

    const parent = await this.prisma.comment.findFirst({
      where: { id: parentId, tenantId },
    });

    if (!parent) {
      throw new NotFoundException(`Parent comment ${parentId} not found.`);
    }

    const comment = await this.prisma.comment.create({
      data: {
        tenantId,
        userId: actor.userId,
        episodeId: parent.episodeId,
        podcastId: parent.podcastId,
        content: dto.content,
        parentId: parent.id,
      },
      include: commentInclude,
    });

    return comment;
  }

  async update(tenantId: string, id: string, dto: UpdateCommentDto, actor: CommentActorContext) {
    this.ensureTenantAccess(tenantId, actor);
    const comment = await this.ensureExists(tenantId, id);
    this.ensureCanMutate(comment.userId, actor);

    const updated = await this.prisma.comment.update({
      where: { id },
      data: {
        ...(dto.content ? { content: dto.content } : {}),
      },
      include: commentInclude,
    });
    return updated;
  }

  async delete(tenantId: string, id: string, actor: CommentActorContext) {
    this.ensureTenantAccess(tenantId, actor);
    const comment = await this.ensureExists(tenantId, id);
    this.ensureCanMutate(comment.userId, actor);
    await this.prisma.comment.delete({ where: { id } });
  }

  private async ensureExists(tenantId: string, id: string) {
    const exists = await this.prisma.comment.findFirst({ where: { id, tenantId } });
    if (!exists) {
      throw new NotFoundException(`Comment ${id} not found.`);
    }
    return exists;
  }

  private ensureTenantAccess(tenantId: string, actor: CommentActorContext) {
    if (actor.role !== UserRole.ADMIN && actor.tenantId !== tenantId) {
      throw new ForbiddenException('Access to tenant comments denied.');
    }
  }

  private ensureCanMutate(ownerId: string, actor: CommentActorContext) {
    if (actor.role !== UserRole.ADMIN && ownerId !== actor.userId) {
      throw new ForbiddenException('Only the owner or an admin can modify this comment.');
    }
  }
}
