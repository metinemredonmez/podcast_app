import { Module } from '@nestjs/common';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';
import { EPISODES_REPOSITORY } from './repositories/episodes.repository';
import { EpisodesPrismaRepository } from './repositories/episodes.prisma.repository';

@Module({
  imports: [],
  controllers: [EpisodesController],
  providers: [
    EpisodesService,
    {
      provide: EPISODES_REPOSITORY,
      useClass: EpisodesPrismaRepository,
    },
  ],
  exports: [EpisodesService],
})
export class EpisodesModule {}
