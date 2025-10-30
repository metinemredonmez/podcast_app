import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { episodeListSelect, podcastListSelect } from '../../common/prisma/select-configs';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';

@Injectable()
export class EpisodesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CursorPaginationDto): Promise<PaginatedResponseDto<unknown>> {
    const limit = query.limit ?? 20;
    const decoded = query.cursor ? decodeCursor(query.cursor) : undefined;
    const rows = await this.prisma.episode.findMany({
      take: limit + 1,
      ...(decoded
        ? {
            cursor: { id: decoded },
            skip: 1,
          }
        : {}),
      select: { ...episodeListSelect, audioUrl: true, podcastId: true },
      orderBy: { publishedAt: 'desc' },
    });
    return buildPaginatedResponse(rows, limit, (e: any) => e.id);
  }

  async findOne(id: string): Promise<unknown> {
    return this.prisma.episode.findUnique({
      where: { id },
      include: { podcast: { select: podcastListSelect } },
    });
  }

  async create(payload: any): Promise<unknown> {
    const { title, duration, audioUrl, publishedAt, podcastId } = payload ?? {};
    return this.prisma.episode.create({
      data: { title, duration, audioUrl, publishedAt: new Date(publishedAt), podcastId },
      select: { ...episodeListSelect, audioUrl: true, podcastId: true },
    });
  }
}
