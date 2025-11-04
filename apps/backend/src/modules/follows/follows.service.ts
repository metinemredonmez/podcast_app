import { ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { FollowDto } from './dto/follow.dto';
import { ListFollowsDto } from './dto/list-follows.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(dto: FollowDto, actor: JwtPayload) {
    const tenantId = this.resolveTenant(dto.tenantId, actor);
    const userId = this.resolveUser(dto.userId, actor);
    const existing = await this.prisma.follow.findUnique({
      where: {
        userId_podcastId: {
          userId,
          podcastId: dto.podcastId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Podcast already followed.');
    }

    return this.prisma.follow.create({
      data: {
        tenantId,
        userId,
        podcastId: dto.podcastId,
      },
    });
  }

  async unfollow(dto: FollowDto, actor: JwtPayload) {
    const tenantId = this.resolveTenant(dto.tenantId, actor);
    const userId = this.resolveUser(dto.userId, actor);
    const existing = await this.prisma.follow.findUnique({
      where: {
        userId_podcastId: {
          userId,
          podcastId: dto.podcastId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Follow relationship not found.');
    }

    if (existing.tenantId !== tenantId) {
      throw new ForbiddenException('Follow relationship belongs to a different tenant.');
    }

    await this.prisma.follow.delete({ where: { id: existing.id } });
  }

  async listByUser(filter: ListFollowsDto, actor: JwtPayload) {
    const tenantId = this.resolveTenant(filter.tenantId, actor);
    const userId = this.resolveUser(filter.userId, actor);
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.prisma.follow.findMany({
      where: {
        tenantId,
        userId,
        ...(filter.podcastId ? { podcastId: filter.podcastId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  private resolveTenant(requested: string | undefined, actor: JwtPayload): string {
    if (!requested || requested === actor.tenantId) {
      return actor.tenantId;
    }
    if (actor.role === UserRole.ADMIN) {
      return requested;
    }
    throw new ForbiddenException('Cross-tenant access is not permitted.');
  }

  private resolveUser(requested: string | undefined, actor: JwtPayload): string {
    if (!requested || requested === actor.sub) {
      return actor.sub;
    }
    if (actor.role === UserRole.ADMIN) {
      return requested;
    }
    throw new ForbiddenException('Cannot manage follow relationships for another user.');
  }
}
