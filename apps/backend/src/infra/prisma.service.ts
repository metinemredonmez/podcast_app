import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    // Type-safe query logging
    this.$on('query' as any, (event: any) => {
      if (event.duration > 100) {
        console.warn(`Slow query (${event.duration}ms): ${event.query}`);
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
