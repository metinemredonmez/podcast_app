import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: ListCategoriesDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.prisma.category.findMany({
      where: {
        ...(filter.tenantId ? { tenantId: filter.tenantId } : {}),
        ...(filter.search
          ? {
              name: {
                contains: filter.search,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async findOne(tenantId: string | undefined, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found.`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    if (!dto.tenantId) {
      throw new BadRequestException('tenantId is required to create a category.');
    }

    const slug = dto.slug ?? this.slugify(dto.name);

    const existing = await this.prisma.category.findFirst({
      where: { tenantId: dto.tenantId, slug },
    });
    if (existing) {
      throw new ConflictException(`Category slug '${slug}' already exists for this tenant.`);
    }

    return this.prisma.category.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        slug,
        description: dto.description,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required to update a category.');
    }
    await this.ensureExists(tenantId, id);

    if (dto.slug) {
      const existing = await this.prisma.category.findFirst({
        where: {
          tenantId,
          slug: dto.slug,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(`Category slug '${dto.slug}' already exists for this tenant.`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
  }

  async delete(tenantId: string, id: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required to delete a category.');
    }
    await this.ensureExists(tenantId, id);
    await this.prisma.category.delete({ where: { id } });
  }

  private async ensureExists(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found.`);
    }
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/--+/g, '-')
      .slice(0, 160);
  }
}
