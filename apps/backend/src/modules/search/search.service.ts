import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { ElasticsearchService } from '../../infra/elasticsearch/elasticsearch.service';
import { SearchQueryDto, SearchEntityType } from './dto/search-query.dto';

interface SearchResults {
  podcasts: Prisma.PodcastGetPayload<{}>[];
  episodes: Prisma.EpisodeGetPayload<{}>[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly elasticsearchNode?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly elasticsearch: ElasticsearchService,
    private readonly config: ConfigService,
  ) {
    this.elasticsearchNode = this.config.get<string>('ELASTICSEARCH_NODE', { infer: true });
    if (!this.elasticsearchNode) {
      this.logger.warn('Elasticsearch node not configured; falling back to Prisma search.');
    }
  }

  async search(dto: SearchQueryDto): Promise<SearchResults> {
    const searchTerm = dto.query?.trim() ?? '';
    if (!searchTerm.length) {
      return { podcasts: [], episodes: [] };
    }

    const elasticResults = await this.tryElasticsearch(searchTerm, dto);
    if (elasticResults) {
      return elasticResults;
    }

    return this.fallbackSearch(searchTerm, dto);
  }

  private async tryElasticsearch(query: string, dto: SearchQueryDto): Promise<SearchResults | null> {
    if (!this.elasticsearchNode) {
      return null;
    }

    try {
      const index = dto.type === SearchEntityType.EPISODE
        ? 'episodes'
        : dto.type === SearchEntityType.PODCAST
        ? 'podcasts'
        : 'podcasts,episodes';

      const take = dto.size ?? 20;
      const from = ((dto.page ?? 1) - 1) * take;

      const response = await this.elasticsearch.search(index, {
        query: {
          multi_match: {
            query,
            fields: ['title^2', 'description'],
            fuzziness: 'AUTO',
          },
        },
        from,
        size: take,
      });

      const hits = response?.hits?.hits ?? [];
      const podcastIds = new Set<string>();
      const episodeIds = new Set<string>();

      for (const hit of hits) {
        const source = hit._source ?? {};
        const entityType = (source.entityType ?? hit._index ?? '').toString().toLowerCase();
        const id = source.id ?? hit._id;
        if (!id) continue;

        if (entityType.includes('podcast')) {
          podcastIds.add(String(id));
        } else if (entityType.includes('episode')) {
          episodeIds.add(String(id));
        }
      }

      if (podcastIds.size === 0 && episodeIds.size === 0) {
        return null;
      }

      const [podcasts, episodes] = await Promise.all([
        podcastIds.size && this.shouldFetchPodcasts(dto.type)
          ? this.prisma.podcast.findMany({
              where: this.buildPodcastWhere(dto, Array.from(podcastIds)),
            })
          : [],
        episodeIds.size && this.shouldFetchEpisodes(dto.type)
          ? this.prisma.episode.findMany({
              where: this.buildEpisodeWhere(dto, Array.from(episodeIds)),
            })
          : [],
      ]);

      return { podcasts, episodes };
    } catch (error) {
      this.logger.warn(`Elasticsearch unavailable, falling back to Prisma search: ${String(error)}`);
      return null;
    }
  }

  private async fallbackSearch(query: string, dto: SearchQueryDto): Promise<SearchResults> {
    const textContains: Prisma.StringFilter = {
      contains: query,
      mode: 'insensitive',
    };

    const page = dto.page ?? 1;
    const size = dto.size ?? 20;
    const skip = (page - 1) * size;

    const fetchPodcasts = this.shouldFetchPodcasts(dto.type)
      ? this.prisma.podcast.findMany({
          where: this.buildPodcastWhere(dto, undefined, textContains),
          orderBy: { createdAt: 'desc' },
          skip,
          take: size,
        })
      : Promise.resolve([]);

    const fetchEpisodes = this.shouldFetchEpisodes(dto.type)
      ? this.prisma.episode.findMany({
          where: this.buildEpisodeWhere(dto, undefined, textContains),
          orderBy: { createdAt: 'desc' },
          skip,
          take: size,
        })
      : Promise.resolve([]);

    const [podcasts, episodes] = await Promise.all([fetchPodcasts, fetchEpisodes]);

    return { podcasts, episodes };
  }

  private shouldFetchPodcasts(type?: SearchEntityType): boolean {
    return type !== SearchEntityType.EPISODE;
  }

  private shouldFetchEpisodes(type?: SearchEntityType): boolean {
    return type !== SearchEntityType.PODCAST;
  }

  private buildPodcastWhere(
    dto: SearchQueryDto,
    ids?: string[],
    textFilter?: Prisma.StringFilter,
  ): Prisma.PodcastWhereInput {
    const where: Prisma.PodcastWhereInput = {};

    if (textFilter) {
      where.OR = [{ title: textFilter }, { description: textFilter }];
    }

    if (dto.tenantId) {
      where.tenantId = dto.tenantId;
    }

    if (dto.isPublished !== undefined) {
      where.isPublished = dto.isPublished;
    }

    if (dto.categoryId) {
      where.categories = {
        some: { categoryId: dto.categoryId },
      };
    }

    if (ids && ids.length) {
      where.id = { in: ids };
    }

    return where;
  }

  private buildEpisodeWhere(
    dto: SearchQueryDto,
    ids?: string[],
    textFilter?: Prisma.StringFilter,
  ): Prisma.EpisodeWhereInput {
    const where: Prisma.EpisodeWhereInput = {};

    if (textFilter) {
      where.OR = [{ title: textFilter }, { description: textFilter }];
    }

    if (dto.tenantId) {
      where.tenantId = dto.tenantId;
    }

    if (dto.isPublished !== undefined) {
      where.isPublished = dto.isPublished;
    }

    if (dto.categoryId) {
      where.podcast = {
        categories: {
          some: { categoryId: dto.categoryId },
        },
      };
    }

    if (ids && ids.length) {
      where.id = { in: ids };
    }

    return where;
  }
}
