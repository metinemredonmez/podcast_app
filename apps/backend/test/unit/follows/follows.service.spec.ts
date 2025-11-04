import 'reflect-metadata';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FollowsService } from '../../../src/modules/follows/follows.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { ListFollowsDto } from '../../../src/modules/follows/dto/list-follows.dto';

describe('FollowsService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let service: FollowsService;

  beforeEach(() => {
    prisma = {
      follow: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    service = new FollowsService(prisma);
  });

  it('creates follow when unique constraint satisfied', async () => {
    prisma.follow.findUnique.mockResolvedValue(null);
    prisma.follow.create.mockResolvedValue({ id: 'f1' } as any);

    const result = await service.follow({ tenantId: 'tenant-1', userId: 'user-1', podcastId: 'pod-1' });

    expect(prisma.follow.findUnique).toHaveBeenCalledWith({
      where: {
        userId_podcastId: {
          userId: 'user-1',
          podcastId: 'pod-1',
        },
      },
    });
    expect(result).toEqual({ id: 'f1' });
  });

  it('throws conflict when follow already exists', async () => {
    prisma.follow.findUnique.mockResolvedValue({ id: 'f1' } as any);

    await expect(
      service.follow({ tenantId: 'tenant-1', userId: 'user-1', podcastId: 'pod-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes follow when relationship exists', async () => {
    prisma.follow.findUnique.mockResolvedValue({ id: 'f1' } as any);

    await service.unfollow({ tenantId: 'tenant-1', userId: 'user-1', podcastId: 'pod-1' });

    expect(prisma.follow.delete).toHaveBeenCalledWith({ where: { id: 'f1' } });
  });

  it('throws not found when unfollow missing relationship', async () => {
    prisma.follow.findUnique.mockResolvedValue(null);

    await expect(
      service.unfollow({ tenantId: 'tenant-1', userId: 'user-1', podcastId: 'pod-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists follows with pagination and filters', async () => {
    prisma.follow.findMany.mockResolvedValue([]);
    const filter: ListFollowsDto = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      podcastId: 'pod-1',
      page: 2,
      limit: 5,
    };

    await service.listByUser(filter);

    expect(prisma.follow.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        podcastId: 'pod-1',
      },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    });
  });
});
