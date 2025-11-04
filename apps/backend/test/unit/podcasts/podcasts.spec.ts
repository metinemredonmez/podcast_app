import 'reflect-metadata';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PodcastsService } from '../../../src/modules/podcasts/podcasts.service';
import { PODCASTS_REPOSITORY, PodcastsRepository } from '../../../src/modules/podcasts/repositories/podcasts.repository';
import { CursorPaginationDto } from '../../../src/common/dto/cursor-pagination.dto';

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
    const result = await service.findAll({ limit: 5 } as CursorPaginationDto);

    expect(repo.findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
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
    const result = await service.create({ tenantId: 't1', ownerId: 'o1', title: 'My Podcast', isPublished: false } as any);

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'my-podcast' }));
    expect(result.slug).toBe('my-podcast');
  });

  it('throws conflict when slug exists', async () => {
    const repo = mockRepo();
    repo.findBySlug.mockResolvedValue({ id: 'existing' } as any);

    const moduleRef = await Test.createTestingModule({
      providers: [PodcastsService, { provide: PODCASTS_REPOSITORY, useValue: repo }],
    }).compile();

    const service = moduleRef.get(PodcastsService);

    await expect(
      service.create({ tenantId: 't1', ownerId: 'o1', title: 'Existing', slug: 'existing' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws not found when detail missing', async () => {
    const repo = mockRepo();
    repo.findDetailedById.mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [PodcastsService, { provide: PODCASTS_REPOSITORY, useValue: repo }],
    }).compile();

    const service = moduleRef.get(PodcastsService);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
