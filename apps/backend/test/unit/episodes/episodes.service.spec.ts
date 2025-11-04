import 'reflect-metadata';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EpisodesService } from '../../../src/modules/episodes/episodes.service';
import { EpisodesRepository, EpisodeModel } from '../../../src/modules/episodes/repositories/episodes.repository';
import { CursorPaginationDto } from '../../../src/common/dto/cursor-pagination.dto';
import { EpisodeResponseDto } from '../../../src/modules/episodes/dto/episode-response.dto';
import { JwtPayload } from '../../../src/modules/auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../../src/common/enums/prisma.enums';

const createEpisode = (overrides: Partial<EpisodeModel> = {}): EpisodeModel => ({
  id: 'episode-1',
  tenantId: 'tenant-1',
  podcastId: 'podcast-1',
  hostId: 'host-1',
  title: 'Episode 1',
  slug: 'episode-1',
  description: 'Description',
  duration: 1200,
  audioUrl: 'https://cdn.example.com/audio.mp3',
  isPublished: true,
  publishedAt: new Date('2024-01-01T00:00:00Z'),
  episodeNumber: 1,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

describe('EpisodesService', () => {
  let repository: jest.Mocked<EpisodesRepository>;
  let service: EpisodesService;
  const creatorActor: JwtPayload = {
    sub: 'creator-1',
    email: 'creator@example.com',
    tenantId: 'tenant-1',
    role: UserRole.CREATOR,
  };

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    service = new EpisodesService(repository);
  });

  describe('findAll', () => {
    it('returns paginated DTOs with cursor metadata', async () => {
      const now = new Date('2024-01-05T10:00:00Z');
      const query = { limit: 2 } as CursorPaginationDto;
      const rows: EpisodeModel[] = [
        createEpisode({ id: 'episode-1', title: 'First', publishedAt: now }),
        createEpisode({ id: 'episode-2', title: 'Second', publishedAt: now }),
        createEpisode({ id: 'episode-3', title: 'Third', publishedAt: now }),
      ];
      repository.findMany.mockResolvedValue(rows);

      const result = await service.findAll(query, creatorActor);

      expect(repository.findMany).toHaveBeenCalledWith({
        tenantId: creatorActor.tenantId,
        cursor: undefined,
        limit: 2,
        orderBy: 'publishedAt',
        orderDirection: 'desc',
      });
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).not.toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toBeInstanceOf(EpisodeResponseDto);
      expect(result.data[0]).toMatchObject({ id: 'episode-1', title: 'First' });
    });
  });

  describe('findOne', () => {
    it('returns episode DTO when found', async () => {
      const episode = createEpisode({ id: 'episode-42', title: 'Answer' });
      repository.findById.mockResolvedValue(episode);

      const result = await service.findOne('episode-42', creatorActor);

      expect(repository.findById).toHaveBeenCalledWith('episode-42', creatorActor.tenantId);
      expect(result).toBeInstanceOf(EpisodeResponseDto);
      expect(result).toMatchObject({ id: 'episode-42', title: 'Answer' });
    });

    it('throws NotFoundException when episode missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing', creatorActor)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    const basePayload = {
      tenantId: 'tenant-1',
      podcastId: 'podcast-1',
      title: 'My Great Episode',
      duration: 1800,
      audioUrl: 'https://cdn.example.com/episode.mp3',
      isPublished: true,
    };

    it('creates episode with slugified title and inferred publishedAt', async () => {
      const createdEpisode = createEpisode({
        id: 'episode-new',
        title: basePayload.title,
        slug: 'my-great-episode',
        publishedAt: new Date('2024-02-01T00:00:00Z'),
      });

      repository.findBySlug.mockResolvedValue(null);
      repository.create.mockResolvedValue(createdEpisode);

      const result = await service.create(basePayload, creatorActor);

      expect(repository.findBySlug).toHaveBeenCalledWith('tenant-1', 'podcast-1', 'my-great-episode');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'my-great-episode',
          publishedAt: expect.any(Date),
        }),
      );
      expect(result).toBeInstanceOf(EpisodeResponseDto);
      expect(result).toMatchObject({ id: 'episode-new', slug: 'my-great-episode' });
    });

    it('throws ConflictException when slug already exists', async () => {
      repository.findBySlug.mockResolvedValue(createEpisode());

      await expect(service.create(basePayload, creatorActor)).rejects.toBeInstanceOf(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates episode and sets publishedAt when publishing first time', async () => {
      const existing = createEpisode({ id: 'episode-1', isPublished: false, publishedAt: null });
      repository.findById.mockResolvedValue(existing);
      repository.update.mockResolvedValue(createEpisode({ id: 'episode-1', isPublished: true }));

      const result = await service.update('episode-1', { isPublished: true }, creatorActor);

      expect(repository.update).toHaveBeenCalledWith(
        'episode-1',
        creatorActor.tenantId,
        expect.objectContaining({
          isPublished: true,
          publishedAt: expect.any(Date),
        }),
      );
      expect(result).toBeInstanceOf(EpisodeResponseDto);
      expect(result).toMatchObject({ id: 'episode-1', isPublished: true });
    });

    it('throws NotFoundException when updating missing episode', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('missing', { title: 'New title' }, creatorActor)).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
