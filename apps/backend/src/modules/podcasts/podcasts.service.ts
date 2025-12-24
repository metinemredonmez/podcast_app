import { ConflictException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';
import { PODCASTS_REPOSITORY, PodcastDetail, PodcastsRepository, PodcastModel, PodcastListItem } from './repositories/podcasts.repository';
import { CreatePodcastDto } from './dto/create-podcast.dto';
import { UpdatePodcastDto } from './dto/update-podcast.dto';
import { PodcastResponseDto } from './dto/podcast-response.dto';
import { slugify } from '../../common/utils/slug.util';
import { PodcastDetailDto } from './dto/podcast-detail.dto';
import { plainToInstance } from 'class-transformer';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';

@Injectable()
export class PodcastsService {
  constructor(@Inject(PODCASTS_REPOSITORY) private readonly podcastsRepository: PodcastsRepository) {}

  async findAll(query: CursorPaginationDto & { tenantId?: string }, actor: JwtPayload): Promise<PaginatedResponseDto<PodcastResponseDto>> {
    // Admin can see all podcasts across tenants if no specific tenantId is requested
    const tenantId = actor.role === UserRole.ADMIN && !query.tenantId
      ? undefined
      : this.resolveTenant(query.tenantId, actor, { allowCrossTenantForAdmin: true });
    const limit = Number(query.limit ?? 20);
    const decodedRaw = query.cursor ? decodeCursor(query.cursor) : undefined;
    const decoded = decodedRaw || undefined;
    const sortableFields: (keyof PodcastModel)[] = ['createdAt', 'updatedAt', 'title', 'publishedAt'];
    const orderBy = sortableFields.includes(query.orderBy as keyof PodcastModel)
      ? (query.orderBy as keyof PodcastModel)
      : 'createdAt';
    const rows = await this.podcastsRepository.findMany({
      tenantId,
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

  async search(
    query: CursorPaginationDto & { tenantId?: string; search?: string; categoryId?: string; ownerId?: string; isPublished?: boolean },
    actor: JwtPayload,
  ): Promise<PaginatedResponseDto<PodcastResponseDto>> {
    const tenantId = this.resolveTenant(query.tenantId, actor, { allowCrossTenantForAdmin: false });
    const limit = Number(query.limit ?? 20);
    const decodedRaw = query.cursor ? decodeCursor(query.cursor) : undefined;
    const decoded = decodedRaw || undefined;
    const sortableFields: (keyof PodcastModel)[] = ['createdAt', 'updatedAt', 'title', 'publishedAt'];
    const orderBy = sortableFields.includes(query.orderBy as keyof PodcastModel)
      ? (query.orderBy as keyof PodcastModel)
      : 'createdAt';

    const rows = await this.podcastsRepository.searchPodcasts({
      tenantId,
      cursor: decoded,
      limit,
      orderBy,
      orderDirection: query.orderDirection ?? 'desc',
      search: query.search,
      categoryId: query.categoryId,
      ownerId: query.ownerId,
      isPublished: query.isPublished,
    });

    const paginated = buildPaginatedResponse(rows, limit, (podcast) => podcast.id);
    return {
      ...paginated,
      data: paginated.data.map((podcast) => this.toResponseDto(podcast)),
    };
  }

  async findOne(id: string, actor: JwtPayload, tenantId?: string): Promise<PodcastDetailDto> {
    // First find the podcast without tenant filter to check if it exists
    const podcastBasic = await this.podcastsRepository.findById(id);
    if (!podcastBasic) {
      throw new NotFoundException(`Podcast ${id} not found.`);
    }

    // Authorization: Check tenant access (allow cross-tenant for HOCA role as well since they own their podcasts)
    if (podcastBasic.tenantId !== actor.tenantId &&
        actor.role !== UserRole.ADMIN &&
        podcastBasic.ownerId !== actor.userId) {
      throw new ForbiddenException('Access to this podcast is not permitted.');
    }

    // Get detailed podcast info
    const podcast = await this.podcastsRepository.findDetailedById(id, podcastBasic.tenantId);
    if (!podcast) {
      throw new NotFoundException(`Podcast ${id} not found.`);
    }
    return plainToInstance(PodcastDetailDto, podcast);
  }

  async create(payload: CreatePodcastDto, actor: JwtPayload): Promise<PodcastResponseDto> {
    this.ensureCreatorRole(actor);
    const tenantId = this.resolveTenant(payload.tenantId, actor, { allowCrossTenantForAdmin: false });
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
    const existing = await this.podcastsRepository.findBySlug(tenantId, slug);
    if (existing) {
      throw new ConflictException(`Podcast slug '${slug}' already exists for tenant.`);
    }

    const publishedAt = payload.publishedAt
      ? new Date(payload.publishedAt)
      : payload.isPublished
      ? new Date()
      : undefined;

    // Use ownerId from payload, or default to current user
    const ownerId = payload.ownerId || actor.userId;

    // Support both categoryId (singular) and categoryIds (array)
    let categoryIds = payload.categoryIds;
    if (!categoryIds && payload.categoryId) {
      categoryIds = [payload.categoryId];
    }

    const podcast = await this.podcastsRepository.create({
      tenantId,
      ownerId,
      title: payload.title,
      slug,
      description: payload.description,
      coverImageUrl: payload.coverImageUrl,
      isPublished: payload.isPublished,
      publishedAt,
      categoryIds,
      // Media type and quality
      mediaType: payload.mediaType,
      defaultQuality: payload.defaultQuality,
      // Media fields
      audioUrl: payload.audioUrl,
      audioMimeType: payload.audioMimeType,
      videoUrl: payload.videoUrl,
      videoMimeType: payload.videoMimeType,
      youtubeUrl: payload.youtubeUrl,
      externalVideoUrl: payload.externalVideoUrl,
      thumbnailUrl: payload.thumbnailUrl,
      duration: payload.duration,
      // Metadata
      tags: payload.tags,
      isFeatured: payload.isFeatured,
    });

    return this.toResponseDto(podcast);
  }

  async update(id: string, payload: UpdatePodcastDto, actor: JwtPayload, tenantId?: string): Promise<PodcastResponseDto> {
    // First find the podcast without tenant filter to check if it exists
    const podcast = await this.podcastsRepository.findById(id);
    if (!podcast) {
      throw new NotFoundException(`Podcast ${id} not found.`);
    }

    // Authorization: Check tenant access
    if (podcast.tenantId !== actor.tenantId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access to this podcast is not permitted.');
    }

    // Authorization: Only owner or admin can update
    if (podcast.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not authorized to update this podcast.');
    }

    const publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : undefined;

    const updated = await this.podcastsRepository.update(id, podcast.tenantId, {
      ...payload,
      publishedAt,
    });

    return this.toResponseDto(updated);
  }

  async delete(id: string, actor: JwtPayload, tenantId?: string): Promise<void> {
    // First find the podcast without tenant filter to check if it exists
    const podcast = await this.podcastsRepository.findById(id);
    if (!podcast) {
      throw new NotFoundException(`Podcast ${id} not found.`);
    }

    // Authorization: Check tenant access
    if (podcast.tenantId !== actor.tenantId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access to this podcast is not permitted.');
    }

    // Authorization: Only owner or admin can delete
    if (podcast.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not authorized to delete this podcast.');
    }

    await this.podcastsRepository.delete(id, podcast.tenantId);
  }

  async publish(id: string, actor: JwtPayload, tenantId?: string): Promise<PodcastResponseDto> {
    // First find the podcast without tenant filter to check if it exists
    const podcast = await this.podcastsRepository.findById(id);
    if (!podcast) {
      throw new NotFoundException(`Podcast ${id} not found.`);
    }

    // Authorization: Check tenant access
    if (podcast.tenantId !== actor.tenantId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access to this podcast is not permitted.');
    }

    if (podcast.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not authorized to publish this podcast.');
    }

    const updated = await this.podcastsRepository.update(id, podcast.tenantId, {
      isPublished: true,
      publishedAt: podcast.publishedAt || new Date(),
    });

    return this.toResponseDto(updated);
  }

  async unpublish(id: string, actor: JwtPayload, tenantId?: string): Promise<PodcastResponseDto> {
    // First find the podcast without tenant filter to check if it exists
    const podcast = await this.podcastsRepository.findById(id);
    if (!podcast) {
      throw new NotFoundException(`Podcast ${id} not found.`);
    }

    // Authorization: Check tenant access
    if (podcast.tenantId !== actor.tenantId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access to this podcast is not permitted.');
    }

    if (podcast.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not authorized to unpublish this podcast.');
    }

    const updated = await this.podcastsRepository.update(id, podcast.tenantId, {
      isPublished: false,
    });

    return this.toResponseDto(updated);
  }

  private toResponseDto(podcast: PodcastDetail | PodcastModel | PodcastListItem): PodcastResponseDto {
    const listItem = podcast as PodcastListItem;
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
      // Media type and quality
      mediaType: podcast.mediaType,
      defaultQuality: podcast.defaultQuality,
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
      // Relations (from list queries)
      owner: listItem.owner,
      categories: listItem.categories,
      _count: listItem._count,
    });
  }

  private resolveTenant(requestedTenantId: string | undefined, actor: JwtPayload, options: { allowCrossTenantForAdmin: boolean }): string {
    if (!requestedTenantId) {
      return actor.tenantId;
    }
    if (requestedTenantId === actor.tenantId) {
      return requestedTenantId;
    }
    if (actor.role === UserRole.ADMIN && options.allowCrossTenantForAdmin) {
      return requestedTenantId;
    }
    throw new ForbiddenException('Access to the requested tenant is not permitted.');
  }

  private ensureCreatorRole(actor: JwtPayload) {
    if (![UserRole.CREATOR, UserRole.HOCA, UserRole.ADMIN].includes(actor.role)) {
      throw new ForbiddenException('Only creators, hocas, or admins may manage podcasts.');
    }
  }
}
