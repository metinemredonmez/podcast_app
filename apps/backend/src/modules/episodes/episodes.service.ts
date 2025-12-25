import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';
import { EPISODES_REPOSITORY, EpisodesRepository, EpisodeModel } from './repositories/episodes.repository';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { EpisodeResponseDto } from './dto/episode-response.dto';
import { slugify } from '../../common/utils/slug.util';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { MediaType, UserRole } from '../../common/enums/prisma.enums';
import { S3Service } from '../../infra/s3/s3.service';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class EpisodesService {
  constructor(
    @Inject(EPISODES_REPOSITORY) private readonly episodesRepository: EpisodesRepository,
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: CursorPaginationDto & { tenantId?: string }, actor: JwtPayload): Promise<PaginatedResponseDto<EpisodeResponseDto>> {
    const tenantId = (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) && !query.tenantId
      ? undefined
      : this.resolveTenant(query.tenantId, actor);
    const limit = Number(query.limit ?? 20);
    const decodedRaw = query.cursor ? decodeCursor(query.cursor) : undefined;
    const decoded = decodedRaw || undefined;
    const sortableFields: (keyof EpisodeModel)[] = ['publishedAt', 'createdAt', 'duration', 'title'];
    const orderBy = sortableFields.includes(query.orderBy as keyof EpisodeModel)
      ? (query.orderBy as keyof EpisodeModel)
      : 'publishedAt';
    const rows = await this.episodesRepository.findMany({
      tenantId,
      cursor: decoded,
      limit,
      orderBy,
      orderDirection: query.orderDirection ?? 'desc',
    });
    const paginated = buildPaginatedResponse(rows, limit, (episode) => episode.id);
    return {
      ...paginated,
      data: await Promise.all(paginated.data.map((episode) => this.toResponseDto(episode))),
    };
  }

  async search(
    query: CursorPaginationDto & { tenantId?: string; search?: string; podcastId?: string; isPublished?: boolean },
    actor: JwtPayload,
  ): Promise<PaginatedResponseDto<EpisodeResponseDto>> {
    const tenantId = (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) && !query.tenantId
      ? undefined
      : this.resolveTenant(query.tenantId, actor);
    const limit = Number(query.limit ?? 20);
    const decodedRaw = query.cursor ? decodeCursor(query.cursor) : undefined;
    const decoded = decodedRaw || undefined;
    const sortableFields: (keyof EpisodeModel)[] = ['publishedAt', 'createdAt', 'duration', 'title'];
    const orderBy = sortableFields.includes(query.orderBy as keyof EpisodeModel)
      ? (query.orderBy as keyof EpisodeModel)
      : 'publishedAt';

    const rows = await this.episodesRepository.searchEpisodes({
      tenantId,
      cursor: decoded,
      limit,
      orderBy,
      orderDirection: query.orderDirection ?? 'desc',
      search: query.search,
      podcastId: query.podcastId,
      isPublished: query.isPublished,
    });

    const paginated = buildPaginatedResponse(rows, limit, (episode) => episode.id);
    return {
      ...paginated,
      data: await Promise.all(paginated.data.map((episode) => this.toResponseDto(episode))),
    };
  }

  async findOne(id: string, actor: JwtPayload, tenantId?: string): Promise<EpisodeResponseDto> {
    const resolvedTenant = this.resolveTenant(tenantId, actor);
    const episode = await this.episodesRepository.findById(id, resolvedTenant);
    if (!episode) {
      throw new NotFoundException(`Episode ${id} not found.`);
    }
    return await this.toResponseDto(episode);
  }

  async create(payload: CreateEpisodeDto, actor: JwtPayload): Promise<EpisodeResponseDto> {
    this.ensureCreator(actor);
    const tenantId = this.resolveTenant(payload.tenantId, actor);
    const podcast = await this.prisma.podcast.findFirst({
      where: { id: payload.podcastId, tenantId },
      select: { id: true, mediaType: true },
    });
    if (!podcast) {
      throw new NotFoundException(`Podcast ${payload.podcastId} not found.`);
    }
    this.ensureMediaCompatibility(podcast.mediaType, payload);
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
    const existing = await this.episodesRepository.findBySlug(tenantId, payload.podcastId, slug);
    if (existing) {
      throw new ConflictException(`Episode slug '${slug}' already exists for this podcast.`);
    }

    const publishedAt = payload.isPublished
      ? payload.publishedAt
        ? new Date(payload.publishedAt)
        : new Date()
      : undefined;

    const created = await this.episodesRepository.create({
      tenantId,
      podcastId: payload.podcastId,
      hostId: payload.hostId,
      title: payload.title,
      slug,
      description: payload.description,
      duration: payload.duration,
      audioUrl: payload.audioUrl,
      audioMimeType: payload.audioMimeType,
      videoUrl: payload.videoUrl,
      videoMimeType: payload.videoMimeType,
      youtubeUrl: payload.youtubeUrl,
      externalVideoUrl: payload.externalVideoUrl,
      tags: payload.tags,
      quality: payload.quality,
      thumbnailUrl: payload.thumbnailUrl,
      isPublished: payload.isPublished,
      publishedAt,
      episodeNumber: payload.episodeNumber,
      seasonNumber: payload.seasonNumber,
      isFeatured: payload.isFeatured,
    });
    return await this.toResponseDto(created);
  }

  async update(id: string, payload: UpdateEpisodeDto, actor: JwtPayload): Promise<EpisodeResponseDto> {
    this.ensureCreator(actor);
    const episode = await this.episodesRepository.findById(id, actor.tenantId);
    if (!episode) {
      throw new NotFoundException(`Episode ${id} not found.`);
    }
    const podcast = await this.prisma.podcast.findFirst({
      where: { id: episode.podcastId, tenantId: actor.tenantId },
      select: { id: true, mediaType: true },
    });
    if (!podcast) {
      throw new NotFoundException(`Podcast ${episode.podcastId} not found.`);
    }
    this.ensureMediaCompatibility(podcast.mediaType, {
      audioUrl: payload.audioUrl ?? episode.audioUrl ?? undefined,
      videoUrl: payload.videoUrl ?? episode.videoUrl ?? undefined,
      youtubeUrl: payload.youtubeUrl ?? episode.youtubeUrl ?? undefined,
      externalVideoUrl: payload.externalVideoUrl ?? episode.externalVideoUrl ?? undefined,
    });
    const publishedAt = payload.isPublished
      ? payload.publishedAt
        ? new Date(payload.publishedAt)
        : episode.publishedAt ?? new Date()
      : payload.publishedAt
      ? new Date(payload.publishedAt)
      : undefined;
    const updated = await this.episodesRepository.update(id, actor.tenantId, {
      title: payload.title ?? undefined,
      description: payload.description ?? undefined,
      duration: payload.duration ?? undefined,
      audioUrl: payload.audioUrl ?? undefined,
      audioMimeType: payload.audioMimeType ?? undefined,
      videoUrl: payload.videoUrl ?? undefined,
      videoMimeType: payload.videoMimeType ?? undefined,
      youtubeUrl: payload.youtubeUrl ?? undefined,
      externalVideoUrl: payload.externalVideoUrl ?? undefined,
      tags: payload.tags ?? undefined,
      quality: payload.quality ?? undefined,
      thumbnailUrl: payload.thumbnailUrl ?? undefined,
      isPublished: payload.isPublished ?? undefined,
      publishedAt,
      episodeNumber: payload.episodeNumber ?? undefined,
      seasonNumber: payload.seasonNumber ?? undefined,
      isFeatured: payload.isFeatured ?? undefined,
    });
    return await this.toResponseDto(updated);
  }

  async delete(id: string, actor: JwtPayload, tenantId?: string): Promise<void> {
    this.ensureCreator(actor);
    const resolvedTenant = this.resolveTenant(tenantId, actor);
    const episode = await this.episodesRepository.findById(id, resolvedTenant);
    if (!episode) {
      throw new NotFoundException(`Episode ${id} not found.`);
    }
    await this.episodesRepository.delete(id, resolvedTenant);
  }

  private async toResponseDto(episode: EpisodeModel): Promise<EpisodeResponseDto> {
    // Generate presigned URLs for S3 keys
    const audioUrl = await this.resolveMediaUrl(episode.audioUrl);
    const videoUrl = await this.resolveMediaUrl(episode.videoUrl);
    const thumbnailUrl = await this.resolveMediaUrl(episode.thumbnailUrl);

    return plainToInstance(EpisodeResponseDto, {
      id: episode.id,
      tenantId: episode.tenantId,
      podcastId: episode.podcastId,
      hostId: episode.hostId,
      title: episode.title,
      slug: episode.slug,
      description: episode.description,
      duration: episode.duration,
      audioUrl,
      audioMimeType: episode.audioMimeType,
      videoUrl,
      videoMimeType: episode.videoMimeType,
      youtubeUrl: episode.youtubeUrl,
      externalVideoUrl: episode.externalVideoUrl,
      tags: episode.tags,
      quality: episode.quality,
      thumbnailUrl,
      isPublished: episode.isPublished,
      publishedAt: episode.publishedAt,
      isExplicit: episode.isExplicit,
      isFeatured: episode.isFeatured,
      episodeNumber: episode.episodeNumber,
      seasonNumber: episode.seasonNumber,
      podcast: episode.podcast
        ? {
            id: episode.podcast.id,
            title: episode.podcast.title,
            coverImageUrl: episode.podcast.coverImageUrl ?? undefined,
            mediaType: episode.podcast.mediaType ?? undefined,
          }
        : undefined,
      createdAt: episode.createdAt,
      updatedAt: episode.updatedAt,
    });
  }

  /**
   * Resolves a media URL - if it's an S3 key, generates a public URL.
   * If it's already a full URL (http/https), returns it as-is.
   */
  private async resolveMediaUrl(url: string | null | undefined): Promise<string | null> {
    if (!url) return null;

    // If it's a local/static path (starts with /), return as-is
    if (url.startsWith('/')) {
      return url;
    }

    // If it's already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // It's an S3 key - generate public URL (no expiration)
    return this.s3Service.getPublicUrl(url);
  }

  private resolveTenant(requestedTenantId: string | undefined, actor: JwtPayload): string {
    if (!requestedTenantId || requestedTenantId === actor.tenantId) {
      return actor.tenantId;
    }
    if (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) {
      return requestedTenantId;
    }
    throw new ForbiddenException('Access to the requested tenant is not permitted.');
  }

  private ensureCreator(actor: JwtPayload) {
    if (![UserRole.CREATOR, UserRole.HOCA, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role)) {
      throw new ForbiddenException('Only creators, hocas, or admins may manage episodes.');
    }
  }

  private ensureMediaCompatibility(
    mediaType: MediaType | null,
    payload: {
      audioUrl?: string | null;
      videoUrl?: string | null;
      youtubeUrl?: string | null;
      externalVideoUrl?: string | null;
    },
  ) {
    const audioProvided = Boolean(payload.audioUrl);
    const videoProvided = Boolean(payload.videoUrl || payload.youtubeUrl || payload.externalVideoUrl);

    if (mediaType === MediaType.AUDIO) {
      if (!audioProvided) {
        throw new BadRequestException('Audio podcasts require an audio file.');
      }
      if (videoProvided) {
        throw new BadRequestException('Audio podcasts cannot include video content.');
      }
      return;
    }

    if (mediaType === MediaType.VIDEO) {
      if (!videoProvided) {
        throw new BadRequestException('Video podcasts require a video source.');
      }
      if (audioProvided) {
        throw new BadRequestException('Video podcasts cannot include audio-only content.');
      }
      return;
    }

    if (!audioProvided && !videoProvided) {
      throw new BadRequestException('Episodes must include at least one audio or video source.');
    }
  }
}
