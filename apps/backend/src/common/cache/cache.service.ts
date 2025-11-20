import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (optional, defaults to 5 minutes)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.del(key)));
    }
  }

  /**
   * Reset entire cache
   */
  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  /**
   * Get all keys matching pattern
   */
  private async keys(pattern: string): Promise<string[]> {
    const store = this.cacheManager.store as any;
    if (store.keys) {
      return await store.keys(pattern);
    }
    return [];
  }

  /**
   * Cache key builders for consistent naming
   */
  static keys = {
    podcast: (id: string) => `podcast:${id}`,
    podcasts: (tenantId: string, page: number) => `podcasts:${tenantId}:page:${page}`,
    podcastsByCategory: (categoryId: string, page: number) => `podcasts:category:${categoryId}:page:${page}`,

    episode: (id: string) => `episode:${id}`,
    episodes: (podcastId: string, page: number) => `episodes:${podcastId}:page:${page}`,

    user: (id: string) => `user:${id}`,
    userByEmail: (email: string) => `user:email:${email}`,

    category: (id: string) => `category:${id}`,
    categories: (tenantId: string) => `categories:${tenantId}`,

    favorites: (userId: string) => `favorites:${userId}`,
    progress: (userId: string, episodeId: string) => `progress:${userId}:${episodeId}`,
    history: (userId: string) => `history:${userId}`,

    search: (query: string, type: 'podcast' | 'episode') => `search:${type}:${query}`,
  };

  /**
   * Cache TTLs (in milliseconds)
   */
  static ttl = {
    short: 60 * 1000, // 1 minute
    medium: 5 * 60 * 1000, // 5 minutes
    long: 30 * 60 * 1000, // 30 minutes
    day: 24 * 60 * 60 * 1000, // 1 day
  };
}
