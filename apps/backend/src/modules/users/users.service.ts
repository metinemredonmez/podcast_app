import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { podcastListSelect, userBasicSelect } from '../../common/prisma/select-configs';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CursorPaginationDto): Promise<PaginatedResponseDto<unknown>> {
    const limit = query.limit ?? 20;
    const decoded = query.cursor ? decodeCursor(query.cursor) : undefined;
    const rows = await this.prisma.user.findMany({
      take: limit + 1,
      ...(decoded
        ? {
            cursor: { id: decoded },
            skip: 1,
          }
        : {}),
      select: { ...userBasicSelect, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return buildPaginatedResponse(rows, limit, (u: any) => u.id);
  }

  async findOne(id: string): Promise<unknown> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...userBasicSelect,
        createdAt: true,
        updatedAt: true,
        podcasts: {
          select: podcastListSelect,
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async create(payload: any): Promise<unknown> {
    const { email, password, name } = payload ?? {};
    return this.prisma.user.create({
      data: { email, password, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }
}
