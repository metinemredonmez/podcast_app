import { Playlist, PlaylistEpisode } from '@prisma/client';
import { CreatePlaylistDto } from '../dto/create-playlist.dto';
import { UpdatePlaylistDto } from '../dto/update-playlist.dto';

export const PLAYLISTS_REPOSITORY = 'PLAYLISTS_REPOSITORY';

export interface IPlaylistsRepository {
  findAll(userId: string): Promise<Playlist[]>;
  findById(id: string, userId: string): Promise<Playlist | null>;
  findByIdWithEpisodes(id: string, userId: string): Promise<Playlist | null>;
  create(userId: string, dto: CreatePlaylistDto): Promise<Playlist>;
  update(id: string, userId: string, dto: UpdatePlaylistDto): Promise<Playlist>;
  delete(id: string, userId: string): Promise<void>;

  // Episode management
  addEpisode(playlistId: string, episodeId: string, order: number): Promise<PlaylistEpisode>;
  removeEpisode(playlistId: string, episodeId: string): Promise<void>;
  isEpisodeInPlaylist(playlistId: string, episodeId: string): Promise<boolean>;
  reorderEpisodes(playlistId: string, episodeOrders: Array<{ episodeId: string; order: number }>): Promise<void>;
}
