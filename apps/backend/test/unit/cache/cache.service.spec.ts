import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from '../../../src/common/cache/cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: any;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
    store: {
      keys: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return undefined for non-existent key', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value in cache with default TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should set value in cache with custom TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 60000;

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });
  });

  describe('del', () => {
    it('should delete value from cache', async () => {
      const key = 'test-key';

      await service.del(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe('delPattern', () => {
    it('should delete all keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:1', 'test:2', 'test:3'];
      mockCacheManager.store.keys.mockResolvedValue(keys);

      await service.delPattern(pattern);

      expect(mockCacheManager.store.keys).toHaveBeenCalledWith(pattern);
      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
      expect(mockCacheManager.del).toHaveBeenCalledWith('test:1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('test:2');
      expect(mockCacheManager.del).toHaveBeenCalledWith('test:3');
    });

    it('should handle empty pattern result', async () => {
      mockCacheManager.store.keys.mockResolvedValue([]);

      await service.delPattern('test:*');

      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset entire cache', async () => {
      await service.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('Cache key builders', () => {
    it('should generate podcast key', () => {
      const key = CacheService.keys.podcast('podcast-123');
      expect(key).toBe('podcast:podcast-123');
    });

    it('should generate podcasts list key', () => {
      const key = CacheService.keys.podcasts('tenant-1', 2);
      expect(key).toBe('podcasts:tenant-1:page:2');
    });

    it('should generate episode key', () => {
      const key = CacheService.keys.episode('episode-123');
      expect(key).toBe('episode:episode-123');
    });

    it('should generate user key', () => {
      const key = CacheService.keys.user('user-123');
      expect(key).toBe('user:user-123');
    });

    it('should generate search key', () => {
      const key = CacheService.keys.search('tech podcasts', 'podcast');
      expect(key).toBe('search:podcast:tech podcasts');
    });
  });

  describe('TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(CacheService.ttl.short).toBe(60 * 1000);
      expect(CacheService.ttl.medium).toBe(5 * 60 * 1000);
      expect(CacheService.ttl.long).toBe(30 * 60 * 1000);
      expect(CacheService.ttl.day).toBe(24 * 60 * 60 * 1000);
    });
  });
});
