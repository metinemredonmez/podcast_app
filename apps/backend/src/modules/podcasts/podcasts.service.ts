import { ConflictException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';
import { PODCASTS_REPOSITORY, PodcastDetail, PodcastsRepository, PodcastModel } from './repositories/podcasts.repository';
import { CreatePodcastDto } from './dto/create-podcast.dto';
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
    const tenantId = this.resolveTenant(query.tenantId, actor, { allowCrossTenantForAdmin: false });
    const limit = query.limit ?? 20;
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

  async findOne(id: string, actor: JwtPayload, tenantId?: string): Promise<PodcastDetailDto> {
    const resolvedTenantId = this.resolveTenant(tenantId, actor, { allowCrossTenantForAdmin: true });
    const podcast = await this.podcastsRepository.findDetailedById(id, resolvedTenantId);
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

    const podcast = await this.podcastsRepository.create({
      tenantId,
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

  private toResponseDto(podcast: PodcastDetail | PodcastModel): PodcastResponseDto {
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
    if (![UserRole.CREATOR, UserRole.ADMIN].includes(actor.role)) {
      throw new ForbiddenException('Only creators or admins may manage podcasts.');
    }
  }
}
