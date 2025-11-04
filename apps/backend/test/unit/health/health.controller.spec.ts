import 'reflect-metadata';
import { HealthController } from '../../../src/modules/health/health.controller';
import { HealthCheckService } from '@nestjs/terminus';
import { PrismaService } from '../../../src/infra/prisma.service';
import { RedisHealthIndicator } from '../../../src/modules/health/indicators/redis.health';

describe('HealthController', () => {
  it('liveness returns up status', async () => {
    const healthCheck = {
      check: jest.fn(async (checks) => Object.assign({}, ...(await Promise.all(checks.map((fn) => fn()))))),
    } as unknown as HealthCheckService;

    const controller = new HealthController(healthCheck, {} as PrismaService, {} as RedisHealthIndicator);

    const result = await controller.liveness();
    expect(result).toEqual({ liveness: { status: 'up' } });
  });

  it('readiness runs prisma and redis checks', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue(1) } as unknown as PrismaService;
    const redisIndicator = { isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }) } as unknown as RedisHealthIndicator;
    const healthCheck = {
      check: jest.fn(async (checks) => Object.assign({}, ...(await Promise.all(checks.map((fn) => fn()))))),
    } as unknown as HealthCheckService;

    const controller = new HealthController(healthCheck, prisma, redisIndicator);

    const result = await controller.readiness();
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(redisIndicator.isHealthy).toHaveBeenCalledWith('redis');
    expect(result).toEqual({ database: { status: 'up' }, redis: { status: 'up' } });
  });
});
