import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { ReviewsService } from '../../../src/modules/reviews/reviews.service';
import { PrismaService } from '../../../src/infra/prisma.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: any;

  const mockReview = {
    id: 'review-1',
    userId: 'user-1',
    podcastId: 'podcast-1',
    rating: 5,
    title: 'Great podcast!',
    content: 'Really enjoyed this.',
    isPublic: true,
    createdAt: new Date(),
    user: { id: 'user-1', name: 'John', avatarUrl: null },
    _count: { helpfulVotes: 10 },
  };

  beforeEach(async () => {
    prisma = {
      review: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      reviewHelpfulVote: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('findAll', () => {
    it('should return paginated reviews', async () => {
      prisma.review.findMany.mockResolvedValue([mockReview]);
      prisma.review.count.mockResolvedValue(1);

      const result = await service.findAll('podcast-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return review when found', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.findById('review-1');

      expect(result.id).toBe('review-1');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.review.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('should return review summary with distribution', async () => {
      prisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 100 },
      });
      prisma.review.groupBy.mockResolvedValue([
        { rating: 5, _count: { rating: 60 } },
        { rating: 4, _count: { rating: 25 } },
        { rating: 3, _count: { rating: 10 } },
        { rating: 2, _count: { rating: 3 } },
        { rating: 1, _count: { rating: 2 } },
      ]);

      const result = await service.getSummary('podcast-1');

      expect(result.averageRating).toBe(4.5);
      expect(result.totalReviews).toBe(100);
      expect(result.distribution[5]).toBe(60);
    });
  });

  describe('create', () => {
    it('should create review when user has not reviewed yet', async () => {
      prisma.review.findFirst.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue(mockReview);

      const result = await service.create('user-1', 'podcast-1', {
        rating: 5,
        title: 'Great!',
        content: 'Loved it',
      });

      expect(result.id).toBe('review-1');
    });

    it('should throw ConflictException when already reviewed', async () => {
      prisma.review.findFirst.mockResolvedValue(mockReview);

      await expect(
        service.create('user-1', 'podcast-1', { rating: 5 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update review when owner', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.update.mockResolvedValue({ ...mockReview, rating: 4 });

      const result = await service.update('review-1', 'user-1', { rating: 4 });

      expect(result.rating).toBe(4);
    });

    it('should throw ForbiddenException when not owner', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.update('review-1', 'other-user', { rating: 4 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete review when owner', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.delete.mockResolvedValue(mockReview);

      await service.delete('review-1', 'user-1');

      expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: 'review-1' } });
    });

    it('should throw ForbiddenException when not owner', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(service.delete('review-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('voteHelpful', () => {
    it('should upsert helpful vote', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.reviewHelpfulVote.upsert.mockResolvedValue({
        userId: 'user-2',
        reviewId: 'review-1',
        isHelpful: true,
      });

      const result = await service.voteHelpful('review-1', 'user-2', true);

      expect(prisma.reviewHelpfulVote.upsert).toHaveBeenCalled();
      expect(result.isHelpful).toBe(true);
    });
  });
});
