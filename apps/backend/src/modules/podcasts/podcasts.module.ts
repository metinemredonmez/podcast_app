import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PodcastsController } from './podcasts.controller';
import { PodcastsService } from './podcasts.service';
import { PodcastEntity } from './entities/podcast.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PodcastEntity])],
  controllers: [PodcastsController],
  providers: [PodcastsService],
  exports: [PodcastsService],
})
export class PodcastsModule {}
