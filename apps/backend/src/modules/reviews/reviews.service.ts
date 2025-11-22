import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(podcastId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { podcastId, isPublic: true },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { helpfulVotes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { podcastId, isPublic: true } }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { helpfulVotes: true } },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async getSummary(podcastId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { podcastId, isPublic: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { podcastId, isPublic: true },
      _count: { rating: true },
    });

    return {
      averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
      totalReviews: stats._count.rating,
      distribution: distribution.reduce(
        (acc, curr) => {
          acc[curr.rating] = curr._count.rating;
          return acc;
        },
        { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
      ),
    };
  }

  async create(userId: string, podcastId: string, dto: CreateReviewDto) {
    // Check if user already reviewed this podcast
    const existing = await this.prisma.review.findFirst({
      where: { userId, podcastId },
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this podcast');
    }

    return this.prisma.review.create({
      data: {
        userId,
        podcastId,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.findById(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async delete(id: string, userId: string) {
    const review = await this.findById(id);

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({ where: { id } });
  }

  async voteHelpful(reviewId: string, userId: string, isHelpful: boolean) {
    // Verify review exists
    await this.findById(reviewId);

    return this.prisma.reviewHelpfulVote.upsert({
      where: { userId_reviewId: { userId, reviewId } },
      create: { userId, reviewId, isHelpful },
      update: { isHelpful },
    });
  }
}
