import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { FollowDto } from './dto/follow.dto';
import { ListFollowsDto } from './dto/list-follows.dto';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(dto: FollowDto) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        userId_podcastId: {
          userId: dto.userId,
          podcastId: dto.podcastId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Podcast already followed.');
    }

    return this.prisma.follow.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        podcastId: dto.podcastId,
      },
    });
  }

  async unfollow(dto: FollowDto) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        userId_podcastId: {
          userId: dto.userId,
          podcastId: dto.podcastId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Follow relationship not found.');
    }

    await this.prisma.follow.delete({ where: { id: existing.id } });
  }

  async listByUser(filter: ListFollowsDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.prisma.follow.findMany({
      where: {
        ...(filter.tenantId ? { tenantId: filter.tenantId } : {}),
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.podcastId ? { podcastId: filter.podcastId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }
}
