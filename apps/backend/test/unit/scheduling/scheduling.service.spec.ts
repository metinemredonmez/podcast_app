import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SchedulingService } from '../../../src/modules/scheduling/scheduling.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { ScheduleStatus } from '../../../src/common/enums/prisma.enums';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let prisma: any;

  const mockScheduledEpisode = {
    id: 'schedule-1',
    episodeId: 'episode-1',
    scheduledAt: new Date('2025-12-01T10:00:00Z'),
    status: ScheduleStatus.PENDING,
    episode: {
      id: 'episode-1',
      title: 'Test Episode',
      podcast: { id: 'podcast-1', title: 'Test Podcast' },
    },
  };

  const mockEpisode = {
    id: 'episode-1',
    title: 'Test Episode',
    isPublished: false,
  };

  beforeEach(async () => {
    prisma = {
      scheduledEpisode: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      episode: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((operations) => Promise.all(operations)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
  });

  describe('scheduleEpisode', () => {
    it('should schedule an unpublished episode', async () => {
      prisma.scheduledEpisode.findFirst.mockResolvedValue(null);
      prisma.episode.findUnique.mockResolvedValue(mockEpisode);
      prisma.scheduledEpisode.create.mockResolvedValue(mockScheduledEpisode);

      const result = await service.scheduleEpisode(
        { episodeId: 'episode-1', scheduledAt: new Date('2025-12-01T10:00:00Z') },
        'user-1',
      );

      expect(result.id).toBe('schedule-1');
      expect(prisma.scheduledEpisode.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when already scheduled', async () => {
      prisma.scheduledEpisode.findFirst.mockResolvedValue(mockScheduledEpisode);

      await expect(
        service.scheduleEpisode(
          { episodeId: 'episode-1', scheduledAt: new Date() },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when episode not found', async () => {
      prisma.scheduledEpisode.findFirst.mockResolvedValue(null);
      prisma.episode.findUnique.mockResolvedValue(null);

      await expect(
        service.scheduleEpisode(
          { episodeId: 'missing', scheduledAt: new Date() },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when episode already published', async () => {
      prisma.scheduledEpisode.findFirst.mockResolvedValue(null);
      prisma.episode.findUnique.mockResolvedValue({ ...mockEpisode, isPublished: true });

      await expect(
        service.scheduleEpisode(
          { episodeId: 'episode-1', scheduledAt: new Date() },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getScheduled', () => {
    it('should return pending scheduled episodes by default', async () => {
      prisma.scheduledEpisode.findMany.mockResolvedValue([mockScheduledEpisode]);

      const result = await service.getScheduled();

      expect(prisma.scheduledEpisode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ScheduleStatus.PENDING },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should filter by status when provided', async () => {
      prisma.scheduledEpisode.findMany.mockResolvedValue([]);

      await service.getScheduled(ScheduleStatus.PUBLISHED);

      expect(prisma.scheduledEpisode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ScheduleStatus.PUBLISHED },
        }),
      );
    });
  });

  describe('getById', () => {
    it('should return scheduled episode when found', async () => {
      prisma.scheduledEpisode.findUnique.mockResolvedValue(mockScheduledEpisode);

      const result = await service.getById('schedule-1');

      expect(result.id).toBe('schedule-1');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.scheduledEpisode.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update pending schedule', async () => {
      prisma.scheduledEpisode.findUnique.mockResolvedValue(mockScheduledEpisode);
      const newDate = new Date('2025-12-15T10:00:00Z');
      prisma.scheduledEpisode.update.mockResolvedValue({
        ...mockScheduledEpisode,
        scheduledAt: newDate,
      });

      const result = await service.update('schedule-1', { scheduledAt: newDate });

      expect(result.scheduledAt).toEqual(newDate);
    });

    it('should throw ConflictException when already processed', async () => {
      prisma.scheduledEpisode.findUnique.mockResolvedValue({
        ...mockScheduledEpisode,
        status: ScheduleStatus.PUBLISHED,
      });

      await expect(
        service.update('schedule-1', { scheduledAt: new Date() }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancel', () => {
    it('should cancel pending schedule', async () => {
      prisma.scheduledEpisode.findUnique.mockResolvedValue(mockScheduledEpisode);
      prisma.scheduledEpisode.update.mockResolvedValue({
        ...mockScheduledEpisode,
        status: ScheduleStatus.CANCELLED,
      });

      const result = await service.cancel('schedule-1');

      expect(result.status).toBe(ScheduleStatus.CANCELLED);
    });

    it('should throw ConflictException when already processed', async () => {
      prisma.scheduledEpisode.findUnique.mockResolvedValue({
        ...mockScheduledEpisode,
        status: ScheduleStatus.PUBLISHED,
      });

      await expect(service.cancel('schedule-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete scheduled episode', async () => {
      prisma.scheduledEpisode.findUnique.mockResolvedValue(mockScheduledEpisode);
      prisma.scheduledEpisode.delete.mockResolvedValue(mockScheduledEpisode);

      await service.delete('schedule-1');

      expect(prisma.scheduledEpisode.delete).toHaveBeenCalledWith({
        where: { id: 'schedule-1' },
      });
    });
  });
});
