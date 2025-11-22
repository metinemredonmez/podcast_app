import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ModerationService } from '../../../src/modules/moderation/moderation.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { ModerationStatus } from '../../../src/common/enums/prisma.enums';

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: any;

  const mockModerationItem = {
    id: 'mod-1',
    tenantId: 'tenant-1',
    contentType: 'COMMENT',
    contentId: 'content-1',
    reason: 'spam',
    status: ModerationStatus.PENDING,
    reportedById: 'user-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      moderationQueue: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  describe('reportContent', () => {
    it('should create a moderation report', async () => {
      prisma.moderationQueue.findFirst.mockResolvedValue(null);
      prisma.moderationQueue.create.mockResolvedValue(mockModerationItem);

      const result = await service.reportContent({
        entityType: 'COMMENT',
        entityId: 'content-1',
        reason: 'spam',
        reportedBy: 'user-1',
        tenantId: 'tenant-1',
      });

      expect(prisma.moderationQueue.create).toHaveBeenCalled();
      expect(result.id).toBe('mod-1');
    });
  });

  describe('getQueue', () => {
    it('should return items filtered by tenant', async () => {
      prisma.moderationQueue.findMany.mockResolvedValue([mockModerationItem]);

      const result = await service.getQueue(undefined, 'tenant-1');

      expect(prisma.moderationQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1' }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should filter by status when provided', async () => {
      prisma.moderationQueue.findMany.mockResolvedValue([]);

      await service.getQueue(ModerationStatus.APPROVED, 'tenant-1');

      expect(prisma.moderationQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ModerationStatus.APPROVED, tenantId: 'tenant-1' }),
        }),
      );
    });
  });

  describe('getById', () => {
    it('should return item when found', async () => {
      prisma.moderationQueue.findUnique.mockResolvedValue(mockModerationItem);

      const result = await service.getById('mod-1');

      expect(result.id).toBe('mod-1');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.moderationQueue.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('moderate', () => {
    it('should approve content', async () => {
      prisma.moderationQueue.findUnique.mockResolvedValue(mockModerationItem);
      prisma.moderationQueue.update.mockResolvedValue({
        ...mockModerationItem,
        status: ModerationStatus.APPROVED,
      });

      const result = await service.moderate('mod-1', 'moderator-1', ModerationStatus.APPROVED);

      expect(prisma.moderationQueue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ModerationStatus.APPROVED }),
        }),
      );
      expect(result.status).toBe(ModerationStatus.APPROVED);
    });

    it('should reject content with notes', async () => {
      prisma.moderationQueue.findUnique.mockResolvedValue(mockModerationItem);
      prisma.moderationQueue.update.mockResolvedValue({
        ...mockModerationItem,
        status: ModerationStatus.REJECTED,
        notes: 'Violates guidelines',
      });

      const result = await service.moderate('mod-1', 'moderator-1', ModerationStatus.REJECTED, 'Violates guidelines');

      expect(result.status).toBe(ModerationStatus.REJECTED);
    });
  });

  describe('escalate', () => {
    it('should escalate item', async () => {
      prisma.moderationQueue.findUnique.mockResolvedValue(mockModerationItem);
      prisma.moderationQueue.update.mockResolvedValue({
        ...mockModerationItem,
        status: ModerationStatus.ESCALATED,
      });

      const result = await service.escalate('mod-1', 'moderator-1', 'Needs admin review');

      expect(result.status).toBe(ModerationStatus.ESCALATED);
    });
  });

  describe('delete', () => {
    it('should delete item when found', async () => {
      prisma.moderationQueue.findUnique.mockResolvedValue(mockModerationItem);
      prisma.moderationQueue.delete.mockResolvedValue(mockModerationItem);

      await service.delete('mod-1');

      expect(prisma.moderationQueue.delete).toHaveBeenCalledWith({ where: { id: 'mod-1' } });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.moderationQueue.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return moderation statistics', async () => {
      prisma.moderationQueue.count
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(10) // approved
        .mockResolvedValueOnce(3)  // rejected
        .mockResolvedValueOnce(2); // escalated

      const result = await service.getStats('tenant-1');

      expect(result).toEqual({
        pending: 5,
        approved: 10,
        rejected: 3,
        escalated: 2,
        total: 20,
      });
    });
  });
});
