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
      this.$on('query' as any, (event: any) => {
        const duration = typeof event?.duration === 'number' ? event.duration : undefined;
        const query = typeof event?.query === 'string' ? event.query : undefined;
        if (duration && duration > 100 && query) {
          Logger.warn(`Slow query (${duration} ms): ${query}`, 'Prisma');
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
