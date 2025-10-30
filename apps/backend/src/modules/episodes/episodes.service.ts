import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';
import { EPISODES_REPOSITORY, EpisodesRepository, EpisodeModel } from './repositories/episodes.repository';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { EpisodeResponseDto } from './dto/episode-response.dto';
import { slugify } from '../../common/utils/slug.util';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@Injectable()
export class EpisodesService {
  constructor(@Inject(EPISODES_REPOSITORY) private readonly episodesRepository: EpisodesRepository) {}

  async findAll(query: CursorPaginationDto): Promise<PaginatedResponseDto<EpisodeResponseDto>> {
    const limit = query.limit ?? 20;
    const decodedRaw = query.cursor ? decodeCursor(query.cursor) : undefined;
    const decoded = decodedRaw || undefined;
    const sortableFields: (keyof EpisodeModel)[] = ['publishedAt', 'createdAt', 'duration', 'title'];
    const orderBy = sortableFields.includes(query.orderBy as keyof EpisodeModel)
      ? (query.orderBy as keyof EpisodeModel)
      : 'publishedAt';
    const rows = await this.episodesRepository.findMany({
      cursor: decoded,
      limit,
      orderBy,
      orderDirection: query.orderDirection ?? 'desc',
    });
    const paginated = buildPaginatedResponse(rows, limit, (episode) => episode.id);
    return {
      ...paginated,
      data: paginated.data.map((episode) => this.toResponseDto(episode)),
    };
  }

  async findOne(id: string): Promise<EpisodeResponseDto> {
    const episode = await this.episodesRepository.findById(id);
    if (!episode) {
      throw new NotFoundException(`Episode ${id} not found.`);
    }
    return this.toResponseDto(episode);
  }

  async create(payload: CreateEpisodeDto): Promise<EpisodeResponseDto> {
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
    const existing = await this.episodesRepository.findBySlug(payload.podcastId, slug);
    if (existing) {
      throw new ConflictException(`Episode slug '${slug}' already exists for this podcast.`);
    }

    const publishedAt = payload.isPublished
      ? payload.publishedAt
        ? new Date(payload.publishedAt)
        : new Date()
      : undefined;

    const created = await this.episodesRepository.create({
      tenantId: payload.tenantId,
      podcastId: payload.podcastId,
      hostId: payload.hostId,
      title: payload.title,
      slug,
      description: payload.description,
      duration: payload.duration,
      audioUrl: payload.audioUrl,
      isPublished: payload.isPublished,
      publishedAt,
      episodeNumber: payload.episodeNumber,
    });
    return this.toResponseDto(created);
  }

  async update(id: string, payload: UpdateEpisodeDto): Promise<EpisodeResponseDto> {
    const episode = await this.episodesRepository.findById(id);
    if (!episode) {
      throw new NotFoundException(`Episode ${id} not found.`);
    }
    const publishedAt = payload.isPublished
      ? payload.publishedAt
        ? new Date(payload.publishedAt)
        : episode.publishedAt ?? new Date()
      : payload.publishedAt
      ? new Date(payload.publishedAt)
      : undefined;
    const updated = await this.episodesRepository.update(id, {
      title: payload.title ?? undefined,
      description: payload.description ?? undefined,
      duration: payload.duration ?? undefined,
      audioUrl: payload.audioUrl ?? undefined,
      isPublished: payload.isPublished ?? undefined,
      publishedAt,
    });
    return this.toResponseDto(updated);
  }

  private toResponseDto(episode: EpisodeModel): EpisodeResponseDto {
    return plainToInstance(EpisodeResponseDto, {
      id: episode.id,
      tenantId: episode.tenantId,
      podcastId: episode.podcastId,
      hostId: episode.hostId,
      title: episode.title,
      slug: episode.slug,
      description: episode.description,
      duration: episode.duration,
      audioUrl: episode.audioUrl,
      isPublished: episode.isPublished,
      publishedAt: episode.publishedAt,
      episodeNumber: episode.episodeNumber,
      createdAt: episode.createdAt,
      updatedAt: episode.updatedAt,
    });
  }
}
