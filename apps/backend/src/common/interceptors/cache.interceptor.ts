import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';

/**
 * HTTP Cache Interceptor
 * Caches GET requests automatically
 * Use @CacheKey() and @CacheTTL() decorators to customize
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Check if caching is disabled for this endpoint
    const cacheDisabled = Reflect.getMetadata('cache:disable', context.getHandler());
    if (cacheDisabled) {
      return next.handle();
    }

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Skip caching for certain routes
    if (this.shouldSkipCache(url)) {
      return next.handle();
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(request);

    // Try to get from cache
    const cachedResponse = await this.cacheService.get(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // If not in cache, execute request and cache response
    return next.handle().pipe(
      tap(async (response) => {
        if (response) {
          // Get TTL from route metadata or use default
          const ttl = this.getTTL(context);
          await this.cacheService.set(cacheKey, response, ttl);
        }
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const { url, user } = request;
    const userId = user?.userId || 'anonymous';
    const tenantId = user?.tenantId || 'default';

    // Include user and tenant in cache key for personalized content
    return `http:${tenantId}:${userId}:${url}`;
  }

  private shouldSkipCache(url: string): boolean {
    const skipPatterns = [
      '/health',
      '/metrics',
      '/api/docs',
      '/api/auth',
      '/api/users/me', // Always fresh user data
    ];

    return skipPatterns.some((pattern) => url.includes(pattern));
  }

  private getTTL(context: ExecutionContext): number {
    // Check for custom TTL from decorator
    const customTTL = Reflect.getMetadata('cache:ttl', context.getHandler());
    if (customTTL) {
      return customTTL;
    }

    // Default TTL: 5 minutes
    return CacheService.ttl.medium;
  }
}
