import { Module } from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { PLAYLISTS_REPOSITORY } from './repositories/playlists.repository';
import { PlaylistsPrismaRepository } from './repositories/playlists.prisma.repository';

@Module({
  controllers: [PlaylistsController],
  providers: [
    PlaylistsService,
    {
      provide: PLAYLISTS_REPOSITORY,
      useClass: PlaylistsPrismaRepository,
    },
  ],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
