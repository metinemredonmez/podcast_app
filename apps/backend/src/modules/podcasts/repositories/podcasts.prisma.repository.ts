import { Injectable } from '@nestjs/common';
import { Podcast } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma.service';
import {
  CreatePodcastInput,
  PaginationOptions,
  PodcastDetail,
  PodcastsRepository,
} from './podcasts.repository';

@Injectable()
export class PodcastsPrismaRepository implements PodcastsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(options: PaginationOptions): Promise<Podcast[]> {
    const { cursor, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    return this.prisma.podcast.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { [orderBy]: orderDirection },
    });
  }

  async findDetailedById(id: string): Promise<PodcastDetail | null> {
    const podcast = await this.prisma.podcast.findUnique({
      where: { id },
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
      categories: podcast.categories.map(({ category }) => category),
    };
  }

  findById(id: string): Promise<Podcast | null> {
    return this.prisma.podcast.findUnique({ where: { id } });
  }

  findBySlug(tenantId: string, slug: string): Promise<Podcast | null> {
    return this.prisma.podcast.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
  }

  async create(payload: CreatePodcastInput): Promise<Podcast> {
    const { tenantId, ownerId, title, slug, description, coverImageUrl, isPublished, publishedAt, categoryIds } = payload;
    return this.prisma.podcast.create({
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
  }
}
