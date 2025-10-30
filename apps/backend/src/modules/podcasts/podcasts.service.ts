import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Podcast } from '@prisma/client';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';
import { PODCASTS_REPOSITORY, PodcastDetail, PodcastsRepository } from './repositories/podcasts.repository';
import { CreatePodcastDto } from './dto/create-podcast.dto';
import { PodcastResponseDto } from './dto/podcast-response.dto';
import { slugify } from '../../common/utils/slug.util';
import { PodcastDetailDto } from './dto/podcast-detail.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PodcastsService {
  constructor(@Inject(PODCASTS_REPOSITORY) private readonly podcastsRepository: PodcastsRepository) {}

  async findAll(query: CursorPaginationDto): Promise<PaginatedResponseDto<PodcastResponseDto>> {
    const limit = query.limit ?? 20;
    const decodedRaw = query.cursor ? decodeCursor(query.cursor) : undefined;
    const decoded = decodedRaw || undefined;
    const sortableFields: (keyof Podcast)[] = ['createdAt', 'updatedAt', 'title', 'publishedAt'];
    const orderBy = sortableFields.includes(query.orderBy as keyof Podcast)
      ? (query.orderBy as keyof Podcast)
      : 'createdAt';
    const rows = await this.podcastsRepository.findMany({
      cursor: decoded,
      limit,
      orderBy,
      orderDirection: query.orderDirection ?? 'desc',
    });
    const paginated = buildPaginatedResponse(rows, limit, (podcast) => podcast.id);
    return {
      ...paginated,
      data: paginated.data.map((podcast) => this.toResponseDto(podcast)),
    };
  }

  async findOne(id: string): Promise<PodcastDetailDto> {
    const podcast = await this.podcastsRepository.findDetailedById(id);
    if (!podcast) {
      throw new NotFoundException(`Podcast ${id} not found.`);
    }
    return plainToInstance(PodcastDetailDto, podcast);
  }

  async create(payload: CreatePodcastDto): Promise<PodcastResponseDto> {
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
    const existing = await this.podcastsRepository.findBySlug(payload.tenantId, slug);
    if (existing) {
      throw new ConflictException(`Podcast slug '${slug}' already exists for tenant.`);
    }

    const publishedAt = payload.publishedAt
      ? new Date(payload.publishedAt)
      : payload.isPublished
      ? new Date()
      : undefined;

    const podcast = await this.podcastsRepository.create({
      tenantId: payload.tenantId,
      ownerId: payload.ownerId,
      title: payload.title,
      slug,
      description: payload.description,
      coverImageUrl: payload.coverImageUrl,
      isPublished: payload.isPublished,
      publishedAt,
      categoryIds: payload.categoryIds,
    });

    return this.toResponseDto(podcast);
  }

  private toResponseDto(podcast: PodcastDetail | { id: string; tenantId: string; ownerId: string; title: string; slug: string; description: string | null; coverImageUrl: string | null; isPublished: boolean; publishedAt: Date | null; createdAt: Date; updatedAt: Date }): PodcastResponseDto {
    return plainToInstance(PodcastResponseDto, {
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
    });
  }
}
