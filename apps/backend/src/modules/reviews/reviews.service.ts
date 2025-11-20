import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(podcastId: string) {
    return this.prisma.review.findMany({
      where: { podcastId, isPublic: true },
      include: { user: { select: { id: true, name: true, avatarUrl: true } }, _count: { select: { helpfulVotes: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, podcastId: string, data: { rating: number; title?: string; content?: string }) {
    return this.prisma.review.create({ data: { userId, podcastId, ...data } });
  }

  async update(id: string, userId: string, data: any) {
    return this.prisma.review.updateMany({ where: { id, userId }, data });
  }

  async delete(id: string, userId: string) {
    return this.prisma.review.deleteMany({ where: { id, userId } });
  }

  async voteHelpful(reviewId: string, userId: string, isHelpful: boolean) {
    return this.prisma.reviewHelpfulVote.upsert({
      where: { userId_reviewId: { userId, reviewId } },
      create: { userId, reviewId, isHelpful },
      update: { isHelpful },
    });
  }
}
