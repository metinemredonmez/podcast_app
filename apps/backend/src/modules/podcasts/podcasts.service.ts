import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { episodeListSelect, podcastListSelect, userBasicSelect } from '../../common/prisma/select-configs';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';

@Injectable()
export class PodcastsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CursorPaginationDto): Promise<PaginatedResponseDto<unknown>> {
    const limit = query.limit ?? 20;
    const decoded = query.cursor ? decodeCursor(query.cursor) : undefined;
    const rows = await this.prisma.podcast.findMany({
      take: limit + 1,
      ...(decoded
        ? {
            cursor: { id: decoded },
            skip: 1,
          }
        : {}),
      select: { ...podcastListSelect, updatedAt: true, _count: { select: { episodes: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return buildPaginatedResponse(rows, limit, (p: any) => p.id);
  }

  async findOne(id: string): Promise<unknown> {
    return this.prisma.podcast.findUnique({
      where: { id },
      include: {
        user: { select: userBasicSelect },
        episodes: {
          select: episodeListSelect,
          orderBy: { publishedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async create(payload: any): Promise<unknown> {
    const { title, description, userId } = payload ?? {};
    return this.prisma.podcast.create({
      data: { title, description, userId },
      select: { id: true, title: true, description: true, userId: true, createdAt: true },
    });
  }
}
