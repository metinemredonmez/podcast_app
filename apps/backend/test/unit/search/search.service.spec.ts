import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../../../src/modules/search/search.service';
import { PrismaService } from '../../../src/infra/prisma.service';
import { ElasticsearchService } from '../../../src/infra/elasticsearch/elasticsearch.service';
import { SearchEntityType, SearchQueryDto } from '../../../src/modules/search/dto/search-query.dto';

describe('SearchService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let elasticsearch: jest.Mocked<ElasticsearchService>;
  let config: jest.Mocked<ConfigService>;

  const createService = () => new SearchService(prisma, elasticsearch, config);

  beforeEach(() => {
    prisma = {
      podcast: { findMany: jest.fn() },
      episode: { findMany: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;

    elasticsearch = {
      search: jest.fn(),
    } as unknown as jest.Mocked<ElasticsearchService>;

    config = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
  });

  it('delegates to Elasticsearch when node is configured', async () => {
    config.get.mockImplementation((key: string) =>
      key === 'ELASTICSEARCH_NODE' ? 'http://localhost:9200' : undefined,
    );

    const service = createService();

    elasticsearch.search.mockResolvedValue({
      hits: {
        hits: [
          { _index: 'podcasts', _id: 'p1', _source: { id: 'p1' } },
          { _index: 'episodes', _id: 'e1', _source: { id: 'e1' } },
        ],
      },
    });
    prisma.podcast.findMany.mockResolvedValue([{ id: 'p1' }] as any);
    prisma.episode.findMany.mockResolvedValue([{ id: 'e1' }] as any);

    await service.search({
      query: 'podcast',
      tenantId: 'tenant-1',
      type: SearchEntityType.ALL,
      page: 1,
      size: 10,
    });

    expect(elasticsearch.search).toHaveBeenCalledWith(
      'podcasts,episodes',
      expect.objectContaining({
        query: expect.any(Object),
      }),
    );
    expect(prisma.podcast.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['p1'] },
          tenantId: 'tenant-1',
        }),
      }),
    );
  });

  it('falls back to Prisma search when node is not configured', async () => {
    config.get.mockReturnValue(undefined);

    const service = createService();

    prisma.podcast.findMany.mockResolvedValue([{ id: 'p1' }] as any);
    prisma.episode.findMany.mockResolvedValue([{ id: 'e1' }] as any);

    const result = await service.search({
      query: 'technology',
      page: 2,
      size: 5,
      isPublished: true,
    });

    expect(elasticsearch.search).not.toHaveBeenCalled();
    expect(prisma.podcast.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
        }),
      }),
    );
    expect(result).toEqual({
      podcasts: [{ id: 'p1' }],
      episodes: [{ id: 'e1' }],
    });
  });

  it('enforces validation on SearchQueryDto fields', async () => {
    const dto = Object.assign(new SearchQueryDto(), {
      query: '',
      tenantId: 'invalid-uuid',
      categoryId: 'also-invalid',
      isPublished: 'not-a-boolean',
    });

    const errors = await validate(dto);
    const propertiesWithErrors = errors.map((error) => error.property);

    expect(propertiesWithErrors).toEqual(
      expect.arrayContaining(['query', 'tenantId', 'categoryId', 'isPublished']),
    );
  });
});
