import { Module } from '@nestjs/common';
import { PodcastsController } from './podcasts.controller';
import { PodcastsService } from './podcasts.service';
import { RssService } from './services/rss.service';
import { PODCASTS_REPOSITORY } from './repositories/podcasts.repository';
import { PodcastsPrismaRepository } from './repositories/podcasts.prisma.repository';
import { EpisodesModule } from '../episodes/episodes.module';

@Module({
  imports: [EpisodesModule],
  controllers: [PodcastsController],
  providers: [
    PodcastsService,
    RssService,
    {
      provide: PODCASTS_REPOSITORY,
      useClass: PodcastsPrismaRepository,
    },
  ],
  exports: [PodcastsService],
})
export class PodcastsModule {}
