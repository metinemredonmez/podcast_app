import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RedisService } from '../../../infra/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key = 'redis'): Promise<HealthIndicatorResult> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const pong = await this.redis.ping();
      clearTimeout(timeout);
      const responseTime = Date.now() - start;
      return this.getStatus(key, true, { responseTime });
    } catch (e) {
      const responseTime = Date.now() - start;
      return this.getStatus(key, false, { responseTime, error: (e as Error).message });
    }
  }
}


