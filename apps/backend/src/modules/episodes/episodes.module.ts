import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';
import { EpisodeEntity } from './entities/episode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EpisodeEntity])],
  controllers: [EpisodesController],
  providers: [EpisodesService],
  exports: [EpisodesService],
})
export class EpisodesModule {}
