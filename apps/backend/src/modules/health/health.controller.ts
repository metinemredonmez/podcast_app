import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../infra/prisma.service';
import { RedisHealthIndicator } from './indicators/redis.health';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  @Get('liveness')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe (basic process health)' })
  @ApiResponse({ status: 200, description: 'Application is running', schema: { example: { liveness: { status: 'up' } } } })
  @ApiResponse({ status: 500, description: 'Application is not healthy' })
  liveness(): Promise<HealthIndicatorResult[]> {
    return this.health.check([
      async () => ({ liveness: { status: 'up' } }),
    ]);
  }

  @Get('readiness')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (DB and Redis readiness)' })
  @ApiResponse({
    status: 200,
    description: 'All dependencies are healthy',
    schema: {
      example: { status: 'ok', info: { database: { status: 'up' }, redis: { status: 'up', responseTime: 12 } } },
    },
  })
  @ApiResponse({ status: 503, description: 'One or more dependencies are down' })
  readiness(): Promise<HealthIndicatorResult[]> {
    return this.health.check([
      async () => {
        // Prisma DB check
        await this.prisma.$queryRaw`SELECT 1`;
        return { database: { status: 'up' } };
      },
      async () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}

