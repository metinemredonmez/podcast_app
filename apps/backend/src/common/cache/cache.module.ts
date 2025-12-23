import { Module, Global, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import type { RedisClientOptions } from 'redis';
import { CacheService } from './cache.service';

const logger = new Logger('CacheModule');

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync<RedisClientOptions>({
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        return {
          store: await redisStore({
            url: redisUrl,
            ttl: 300000, // Default TTL: 5 minutes (in milliseconds)
            // Connection options
            socket: {
              connectTimeout: 10000,
              reconnectStrategy: (retries) => {
                if (retries > 10) {
                  logger.error('Redis connection failed after 10 retries');
                  return new Error('Redis connection failed');
                }
                return retries * 100; // Exponential backoff
              },
            },
          }),
        };
      },
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class CacheModule {}
