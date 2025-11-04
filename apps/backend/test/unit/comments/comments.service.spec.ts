import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { CommentsService } from '../../../src/modules/comments/comments.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { UserRole } from '../../../src/common/enums/prisma.enums';
import { ReplyCommentDto } from '../../../src/modules/comments/dto/reply-comment.dto';
import { ListCommentsDto } from '../../../src/modules/comments/dto/list-comments.dto';

describe('CommentsService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let service: CommentsService;

  const actor = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    role: UserRole.LISTENER,
  };

  beforeEach(() => {
    prisma = {
      comment: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    service = new CommentsService(prisma);
  });

  it('applies tenant filters and pagination when listing comments', async () => {
    const filter: ListCommentsDto = {
      tenantId: 'tenant-1',
      episodeId: 'episode-1',
      page: 2,
      limit: 10,
    } as ListCommentsDto;

    prisma.comment.findMany.mockResolvedValue([]);

    await service.findAll(filter);

    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          episodeId: 'episode-1',
        }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it('creates replies bound to parent comment context', async () => {
    const parent = {
      id: 'parent-1',
      tenantId: 'tenant-1',
      episodeId: 'episode-1',
      podcastId: 'podcast-1',
      userId: 'user-2',
    } as any;

    prisma.comment.findFirst.mockResolvedValue(parent);

    const created = { id: 'child-1' } as any;
    prisma.comment.create.mockResolvedValue(created);

    const dto: ReplyCommentDto = { content: 'Hello there' } as ReplyCommentDto;

    const result = await service.reply('parent-1', dto, actor);

    expect(prisma.comment.findFirst).toHaveBeenCalledWith({
      where: { id: 'parent-1', tenantId: actor.tenantId },
    });
    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: actor.tenantId,
          userId: actor.userId,
          episodeId: parent.episodeId,
          podcastId: parent.podcastId,
          parentId: parent.id,
        }),
      }),
    );
    expect(result).toBe(created);
  });

  it('prevents non-owners from updating comments', async () => {
    prisma.comment.findFirst.mockResolvedValue({
      id: 'comment-1',
      tenantId: 'tenant-1',
      userId: 'different-user',
    } as any);

    await expect(
      service.update('tenant-1', 'comment-1', { content: 'Updated' }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });
});
