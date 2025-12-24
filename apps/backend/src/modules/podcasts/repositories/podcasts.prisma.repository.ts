import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma.service';
import {
  CreatePodcastInput,
  UpdatePodcastInput,
  PaginationOptions,
  SearchPodcastsOptions,
  PodcastDetail,
  PodcastsRepository,
  PodcastModel,
  PodcastListItem,
} from './podcasts.repository';

type PodcastOrderByInput = Prisma.PodcastOrderByWithRelationInput;

@Injectable()
export class PodcastsPrismaRepository implements PodcastsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(options: PaginationOptions): Promise<PodcastListItem[]> {
    const { tenantId, cursor, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    const orderByInput: PodcastOrderByInput = { [orderBy]: orderDirection };
    const rows = await this.prisma.podcast.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: tenantId ? { tenantId } : {},
      orderBy: orderByInput,
      include: {
        owner: { select: { id: true, name: true } },
        categories: {
          select: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: { select: { episodes: true } },
      },
    });

    // Transform categories relation
    return rows.map((podcast) => ({
      ...podcast,
      mediaType: podcast.mediaType as 'AUDIO' | 'VIDEO' | 'BOTH',
      defaultQuality: podcast.defaultQuality as 'SD' | 'HD' | 'FULL_HD' | 'UHD_4K',
      categories: podcast.categories.map((c) => c.category),
    })) as unknown as PodcastListItem[];
  }

  async searchPodcasts(options: SearchPodcastsOptions): Promise<PodcastListItem[]> {
    const { tenantId, cursor, limit, orderBy = 'createdAt', orderDirection = 'desc', search, categoryId, ownerId, isPublished } = options;

    // Build where clause with proper typing
    const where: Prisma.PodcastWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(categoryId && {
        categories: {
          some: { categoryId },
        },
      }),
      ...(ownerId && { ownerId }),
      ...(isPublished !== undefined && { isPublished }),
    };

    const orderByInput: PodcastOrderByInput = { [orderBy]: orderDirection };

    const rows = await this.prisma.podcast.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy: orderByInput,
      include: {
        owner: { select: { id: true, name: true } },
        categories: {
          select: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: { select: { episodes: true } },
      },
    });

    // Transform categories relation
    return rows.map((podcast) => ({
      ...podcast,
      mediaType: podcast.mediaType as 'AUDIO' | 'VIDEO' | 'BOTH',
      defaultQuality: podcast.defaultQuality as 'SD' | 'HD' | 'FULL_HD' | 'UHD_4K',
      categories: podcast.categories.map((c) => c.category),
    })) as unknown as PodcastListItem[];
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
      // Media type and quality
      mediaType: podcast.mediaType as 'AUDIO' | 'VIDEO' | 'BOTH',
      defaultQuality: podcast.defaultQuality as 'SD' | 'HD' | 'FULL_HD' | 'UHD_4K',
      // Media fields
      audioUrl: podcast.audioUrl,
      audioMimeType: podcast.audioMimeType,
      videoUrl: podcast.videoUrl,
      videoMimeType: podcast.videoMimeType,
      youtubeUrl: podcast.youtubeUrl,
      externalVideoUrl: podcast.externalVideoUrl,
      thumbnailUrl: podcast.thumbnailUrl,
      duration: podcast.duration,
      // Metadata
      tags: podcast.tags,
      isFeatured: podcast.isFeatured,
      owner: podcast.owner,
      episodes: podcast.episodes,
      categories: podcast.categories.map((relation) => relation.category),
    };
  }

  async findById(id: string, tenantId?: string): Promise<PodcastModel | null> {
    // If tenantId is provided, filter by it. Otherwise, find by id only.
    const where = tenantId ? { id, tenantId } : { id };
    const podcast = await this.prisma.podcast.findFirst({ where });
    return podcast as PodcastModel | null;
  }

  async findBySlug(tenantId: string, slug: string): Promise<PodcastModel | null> {
    const podcast = await this.prisma.podcast.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
    return podcast as PodcastModel | null;
  }

  async create(payload: CreatePodcastInput): Promise<PodcastModel> {
    const {
      tenantId,
      ownerId,
      title,
      slug,
      description,
      coverImageUrl,
      isPublished,
      publishedAt,
      categoryIds,
      mediaType,
      defaultQuality,
      audioUrl,
      audioMimeType,
      videoUrl,
      videoMimeType,
      youtubeUrl,
      externalVideoUrl,
      thumbnailUrl,
      duration,
      tags,
      isFeatured,
    } = payload;
    const podcast = await this.prisma.podcast.create({
      data: {
        tenantId,
        ownerId,
        title,
        slug,
        description,
        coverImageUrl: coverImageUrl || '/images/default-podcast-cover.svg',
        isPublished: isPublished ?? false,
        publishedAt,
        mediaType: mediaType ?? 'AUDIO',
        defaultQuality: defaultQuality ?? 'HD',
        audioUrl,
        audioMimeType,
        videoUrl,
        videoMimeType,
        youtubeUrl,
        externalVideoUrl,
        thumbnailUrl: thumbnailUrl || '/images/default-thumbnail.svg',
        duration: duration ?? 0,
        tags: tags ?? [],
        isFeatured: isFeatured ?? false,
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
    const {
      title,
      description,
      coverImageUrl,
      isPublished,
      publishedAt,
      categoryIds,
      mediaType,
      defaultQuality,
      audioUrl,
      audioMimeType,
      videoUrl,
      videoMimeType,
      youtubeUrl,
      externalVideoUrl,
      thumbnailUrl,
      duration,
      tags,
      isFeatured,
    } = payload;

    const updateData = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(coverImageUrl !== undefined && { coverImageUrl }),
      ...(isPublished !== undefined && { isPublished }),
      ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
      ...(mediaType !== undefined && { mediaType }),
      ...(defaultQuality !== undefined && { defaultQuality }),
      ...(audioUrl !== undefined && { audioUrl }),
      ...(audioMimeType !== undefined && { audioMimeType }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(videoMimeType !== undefined && { videoMimeType }),
      ...(youtubeUrl !== undefined && { youtubeUrl }),
      ...(externalVideoUrl !== undefined && { externalVideoUrl }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(duration !== undefined && { duration }),
      ...(tags !== undefined && { tags }),
      ...(isFeatured !== undefined && { isFeatured }),
    };

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
            ...updateData,
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
      data: updateData,
    });

    return podcast as unknown as PodcastModel;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.podcast.delete({
      where: { id, tenantId },
    });
  }
}
