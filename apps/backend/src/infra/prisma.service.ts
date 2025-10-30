import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log:
        process.env.NODE_ENV !== 'production'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'warn' },
              { emit: 'event', level: 'error' },
            ]
          : ['error'],
    });
    if (process.env.NODE_ENV !== 'production') {
      this.$on('query', (e) => {
        const duration = (e as any).duration as number | undefined;
        if (typeof duration === 'number' && duration > 100) {
          Logger.warn(`Slow query (${duration} ms): ${e.query}`, 'Prisma');
        }
      });
    }
  }
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
