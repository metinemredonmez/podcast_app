import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma.service';
import {
  CreatePodcastInput,
  UpdatePodcastInput,
  PaginationOptions,
  SearchPodcastsOptions,
  PodcastDetail,
  PodcastsRepository,
  PodcastModel,
} from './podcasts.repository';

@Injectable()
export class PodcastsPrismaRepository implements PodcastsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(options: PaginationOptions): Promise<PodcastModel[]> {
    const { tenantId, cursor, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    const rows = await this.prisma.podcast.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: { tenantId },
      orderBy: { [orderBy]: orderDirection } as any,
    });
    return rows as unknown as PodcastModel[];
  }

  async searchPodcasts(options: SearchPodcastsOptions): Promise<PodcastModel[]> {
    const { tenantId, cursor, limit, orderBy = 'createdAt', orderDirection = 'desc', search, categoryId, ownerId, isPublished } = options;

    // Build where clause
    const where: any = { tenantId };

    // Search filter (title OR description contains search term)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (categoryId) {
      where.categories = {
        some: {
          categoryId,
        },
      };
    }

    // Owner filter
    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Published status filter
    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    const rows = await this.prisma.podcast.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy: { [orderBy]: orderDirection } as any,
    });

    return rows as unknown as PodcastModel[];
  }

  async findDetailedById(id: string, tenantId: string): Promise<PodcastDetail | null> {
    const podcast = await this.prisma.podcast.findFirst({
      where: { id, tenantId },
      include: {
        owner: { select: { id: true, email: true, name: true } },
        episodes: {
          select: { id: true, title: true, slug: true, duration: true, isPublished: true, publishedAt: true },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        },
        categories: {
          select: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!podcast) {
      return null;
    }

    return {
      id: podcast.id,
      tenantId: podcast.tenantId,
      ownerId: podcast.ownerId,
      title: podcast.title,
      slug: podcast.slug,
      description: podcast.description,
      coverImageUrl: podcast.coverImageUrl,
      isPublished: podcast.isPublished,
      publishedAt: podcast.publishedAt,
      createdAt: podcast.createdAt,
      updatedAt: podcast.updatedAt,
      owner: podcast.owner,
      episodes: podcast.episodes,
      categories: podcast.categories.map((relation: any) => relation.category),
    };
  }

  async findById(id: string, tenantId: string): Promise<PodcastModel | null> {
    const podcast = await this.prisma.podcast.findFirst({ where: { id, tenantId } });
    return podcast as PodcastModel | null;
  }

  async findBySlug(tenantId: string, slug: string): Promise<PodcastModel | null> {
    const podcast = await this.prisma.podcast.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
    return podcast as PodcastModel | null;
  }

  async create(payload: CreatePodcastInput): Promise<PodcastModel> {
    const { tenantId, ownerId, title, slug, description, coverImageUrl, isPublished, publishedAt, categoryIds } = payload;
    const podcast = await this.prisma.podcast.create({
      data: {
        tenantId,
        ownerId,
        title,
        slug,
        description,
        coverImageUrl,
        isPublished: isPublished ?? false,
        publishedAt,
        categories: categoryIds?.length
          ? {
              create: categoryIds.map((categoryId) => ({ categoryId })),
            }
          : undefined,
      },
    });

    return podcast as unknown as PodcastModel;
  }

  async update(id: string, tenantId: string, payload: UpdatePodcastInput): Promise<PodcastModel> {
    const { title, description, coverImageUrl, isPublished, publishedAt, categoryIds } = payload;

    // Update podcast with transaction if categories need to be updated
    if (categoryIds !== undefined) {
      const podcast = await this.prisma.$transaction(async (tx) => {
        // Delete existing category relations
        await tx.podcastCategory.deleteMany({
          where: { podcastId: id },
        });

        // Update podcast and create new category relations
        return await tx.podcast.update({
          where: { id, tenantId },
          data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(coverImageUrl !== undefined && { coverImageUrl }),
            ...(isPublished !== undefined && { isPublished }),
            ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
            categories: categoryIds.length
              ? {
                  create: categoryIds.map((categoryId) => ({ categoryId })),
                }
              : undefined,
          },
        });
      });

      return podcast as unknown as PodcastModel;
    }

    // Simple update without category changes
    const podcast = await this.prisma.podcast.update({
      where: { id, tenantId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(isPublished !== undefined && { isPublished }),
        ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
      },
    });

    return podcast as unknown as PodcastModel;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.podcast.delete({
      where: { id, tenantId },
    });
  }
}
