import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { CreateHocaDto } from './dto/create-hoca.dto';
import { UpdateHocaDto } from './dto/update-hoca.dto';
import { ListHocaDto } from './dto/list-hoca.dto';

const hocasInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.HocaInclude;

@Injectable()
export class HocasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ListHocaDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(filter.tenantId ? { tenantId: filter.tenantId } : {}),
      ...(filter.search
        ? {
            name: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.hoca.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: hocasInclude,
      }),
      this.prisma.hoca.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, id: string) {
    const hoca = await this.prisma.hoca.findFirst({
      where: { id, tenantId },
      include: hocasInclude,
    });
    if (!hoca) {
      throw new NotFoundException(`Hoca ${id} not found.`);
    }
    return hoca;
  }

  async create(dto: CreateHocaDto) {
    const hoca = await this.prisma.hoca.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        name: dto.name,
        bio: dto.bio,
        expertise: dto.expertise,
        avatarUrl: dto.avatarUrl,
      },
      include: hocasInclude,
    });
    return hoca;
  }

  async update(tenantId: string, id: string, dto: UpdateHocaDto) {
    await this.ensureExists(tenantId, id);

    return this.prisma.hoca.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.expertise !== undefined ? { expertise: dto.expertise } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
      include: hocasInclude,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.ensureExists(tenantId, id);
    await this.prisma.hoca.delete({ where: { id } });
  }

  private async ensureExists(tenantId: string, id: string) {
    const exists = await this.prisma.hoca.findFirst({ where: { id, tenantId } });
    if (!exists) {
      throw new NotFoundException(`Hoca ${id} not found.`);
    }
  }
}
