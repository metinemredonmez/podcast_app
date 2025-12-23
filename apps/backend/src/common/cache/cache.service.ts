import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  // Track keys by prefix for efficient deletion without SCAN
  private readonly keyRegistry = new Map<string, Set<string>>();

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Get or set value in cache (cache-aside pattern)
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (optional, defaults to 5 minutes)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
    // Register key by prefix for efficient deletion
    const prefix = this.extractPrefix(key);
    if (prefix) {
      if (!this.keyRegistry.has(prefix)) {
        this.keyRegistry.set(prefix, new Set());
      }
      this.keyRegistry.get(prefix)!.add(key);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
    // Remove from registry
    const prefix = this.extractPrefix(key);
    if (prefix) {
      this.keyRegistry.get(prefix)?.delete(key);
    }
  }

  /**
   * Delete multiple keys by prefix (efficient - no SCAN needed)
   * This replaces the old pattern-based delete which used expensive SCAN operations
   */
  async delByPrefix(prefix: string): Promise<number> {
    const keys = this.keyRegistry.get(prefix);
    if (!keys || keys.size === 0) {
      return 0;
    }
    const keysArray = Array.from(keys);
    await Promise.all(keysArray.map((key) => this.cacheManager.del(key)));
    this.keyRegistry.delete(prefix);
    this.logger.debug(`Deleted ${keysArray.length} keys with prefix: ${prefix}`);
    return keysArray.length;
  }

  /**
   * Delete all keys for a specific entity type and tenant
   * More efficient than pattern matching
   */
  async invalidateEntity(entityType: string, tenantId?: string): Promise<void> {
    const prefix = tenantId ? `${entityType}:${tenantId}` : entityType;
    await this.delByPrefix(prefix);
  }

  /**
   * Reset entire cache
   */
  async reset(): Promise<void> {
    await this.cacheManager.reset();
    this.keyRegistry.clear();
  }

  /**
   * Extract prefix from key (e.g., "podcasts:tenant1:page:1" -> "podcasts:tenant1")
   */
  private extractPrefix(key: string): string | null {
    const parts = key.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return parts[0] || null;
  }

  /**
   * Cache key builders for consistent naming
   */
  static keys = {
    podcast: (id: string) => `podcast:${id}`,
    podcasts: (tenantId: string, page?: number) =>
      page !== undefined ? `podcasts:${tenantId}:page:${page}` : `podcasts:${tenantId}`,
    podcastsByCategory: (categoryId: string, page: number) => `podcasts:category:${categoryId}:page:${page}`,
    podcastList: (tenantId: string) => `podcast-list:${tenantId}`,

    episode: (id: string) => `episode:${id}`,
    episodes: (podcastId: string, page?: number) =>
      page !== undefined ? `episodes:${podcastId}:page:${page}` : `episodes:${podcastId}`,

    user: (id: string) => `user:${id}`,
    userByEmail: (email: string) => `user:email:${email}`,

    category: (id: string) => `category:${id}`,
    categories: (tenantId: string) => `categories:${tenantId}`,

    favorites: (userId: string) => `favorites:${userId}`,
    progress: (userId: string, episodeId: string) => `progress:${userId}:${episodeId}`,
    history: (userId: string) => `history:${userId}`,

    search: (query: string, type: 'podcast' | 'episode') => `search:${type}:${query}`,

    // New prefixes for invalidation
    prefixes: {
      podcasts: (tenantId: string) => `podcasts:${tenantId}`,
      episodes: (podcastId: string) => `episodes:${podcastId}`,
      user: (userId: string) => `user:${userId}`,
    },
  };

  /**
   * Cache TTLs (in milliseconds) - Optimized for better hit rates
   */
  static ttl = {
    short: 2 * 60 * 1000, // 2 minutes (was 1 min - increased for better hit rate)
    medium: 15 * 60 * 1000, // 15 minutes (was 5 min - increased for list caching)
    long: 30 * 60 * 1000, // 30 minutes (unchanged - good for static content)
    day: 24 * 60 * 60 * 1000, // 1 day (unchanged - for rarely changing data)
    podcastList: 15 * 60 * 1000, // 15 minutes for podcast lists
    episodeList: 10 * 60 * 1000, // 10 minutes for episode lists
    userProfile: 5 * 60 * 1000, // 5 minutes for user profiles (more dynamic)
  };
}
