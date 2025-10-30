import { Module } from '@nestjs/common';
import { PodcastsController } from './podcasts.controller';
import { PodcastsService } from './podcasts.service';
import { PODCASTS_REPOSITORY } from './repositories/podcasts.repository';
import { PodcastsPrismaRepository } from './repositories/podcasts.prisma.repository';

@Module({
  imports: [],
  controllers: [PodcastsController],
  providers: [
    PodcastsService,
    {
      provide: PODCASTS_REPOSITORY,
      useClass: PodcastsPrismaRepository,
    },
  ],
  exports: [PodcastsService],
})
export class PodcastsModule {}
