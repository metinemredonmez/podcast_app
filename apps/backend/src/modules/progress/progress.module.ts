import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ProgressPrismaRepository } from './repositories/progress.prisma.repository';
import { PROGRESS_REPOSITORY } from './repositories/progress.repository';
import { PrismaService } from '../../infra/prisma.service';

@Module({
  controllers: [ProgressController],
  providers: [
    ProgressService,
    {
      provide: PROGRESS_REPOSITORY,
      useClass: ProgressPrismaRepository,
    },
    PrismaService,
  ],
  exports: [ProgressService],
})
export class ProgressModule {}
