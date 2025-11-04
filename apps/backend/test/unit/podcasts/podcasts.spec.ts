import 'reflect-metadata';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PodcastsService } from '../../../src/modules/podcasts/podcasts.service';
import { PODCASTS_REPOSITORY, PodcastsRepository } from '../../../src/modules/podcasts/repositories/podcasts.repository';
import { CursorPaginationDto } from '../../../src/common/dto/cursor-pagination.dto';
import { JwtPayload } from '../../../src/modules/auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../../src/common/enums/prisma.enums';

describe('PodcastsService', () => {
  const mockRepo = (): jest.Mocked<PodcastsRepository> => ({
    findMany: jest.fn(),
    findDetailedById: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
  }) as unknown as jest.Mocked<PodcastsRepository>;

  it('paginates podcasts with cursor', async () => {
    const repo = mockRepo();
    repo.findMany.mockResolvedValue([
      {
        id: 'p1',
        tenantId: 't1',
        ownerId: 'o1',
        title: 'Title',
        slug: 'title',
        description: null,
        coverImageUrl: null,
        isPublished: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const moduleRef = await Test.createTestingModule({
      providers: [PodcastsService, { provide: PODCASTS_REPOSITORY, useValue: repo }],
    }).compile();

    const service = moduleRef.get(PodcastsService);
    const actor: JwtPayload = { sub: 'creator', email: 'creator@example.com', tenantId: 't1', role: UserRole.CREATOR };
    const result = await service.findAll({ limit: 5 } as CursorPaginationDto, actor);

    expect(repo.findMany).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', limit: 5 }));
    expect(result.data).toHaveLength(1);
  });

  it('ensures slug uniqueness on create', async () => {
    const repo = mockRepo();
    repo.findBySlug.mockResolvedValue(null);
    repo.create.mockResolvedValue({
      id: 'p1',
      tenantId: 't1',
      ownerId: 'o1',
      title: 'My Podcast',
      slug: 'my-podcast',
      description: null,
      coverImageUrl: null,
      isPublished: false,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const moduleRef = await Test.createTestingModule({
      providers: [PodcastsService, { provide: PODCASTS_REPOSITORY, useValue: repo }],
    }).compile();

    const service = moduleRef.get(PodcastsService);
    const creator: JwtPayload = { sub: 'o1', email: 'owner@example.com', tenantId: 't1', role: UserRole.CREATOR };
    const result = await service.create({ tenantId: 't1', ownerId: 'o1', title: 'My Podcast', isPublished: false } as any, creator);

    expect(repo.findBySlug).toHaveBeenCalledWith('t1', 'my-podcast');
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', slug: 'my-podcast' }));
    expect(result.slug).toBe('my-podcast');
  });

  it('throws conflict when slug exists', async () => {
    const repo = mockRepo();
    repo.findBySlug.mockResolvedValue({ id: 'existing' } as any);

    const moduleRef = await Test.createTestingModule({
      providers: [PodcastsService, { provide: PODCASTS_REPOSITORY, useValue: repo }],
    }).compile();

    const creator: JwtPayload = { sub: 'o1', email: 'owner@example.com', tenantId: 't1', role: UserRole.CREATOR };
    const service = moduleRef.get(PodcastsService);
    await expect(
      service.create({ tenantId: 't1', ownerId: 'o1', title: 'Existing', slug: 'existing' } as any, creator),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws not found when detail missing', async () => {
    const repo = mockRepo();
    repo.findDetailedById.mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [PodcastsService, { provide: PODCASTS_REPOSITORY, useValue: repo }],
    }).compile();

    const service = moduleRef.get(PodcastsService);

    const admin: JwtPayload = { sub: 'admin', email: 'admin@example.com', tenantId: 't1', role: UserRole.ADMIN };
    await expect(service.findOne('missing', admin, 't1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
