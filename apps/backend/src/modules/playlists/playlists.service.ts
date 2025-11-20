import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPlaylistsRepository, PLAYLISTS_REPOSITORY } from './repositories/playlists.repository';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddEpisodeToPlaylistDto } from './dto/add-episode.dto';
import { PlaylistResponseDto } from './dto/playlist-response.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class PlaylistsService {
  constructor(
    @Inject(PLAYLISTS_REPOSITORY)
    private readonly repository: IPlaylistsRepository,
  ) {}

  async findAll(user: JwtPayload): Promise<PlaylistResponseDto[]> {
    const playlists = await this.repository.findAll(user.userId);
    return playlists.map((playlist: any) => ({
      ...playlist,
      episodeCount: playlist._count?.episodes || 0,
    }));
  }

  async findOne(id: string, user: JwtPayload): Promise<PlaylistResponseDto> {
    const playlist = await this.repository.findByIdWithEpisodes(id, user.userId);

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    return {
      ...playlist,
      episodeCount: playlist.episodes?.length || 0,
    } as any;
  }

  async create(dto: CreatePlaylistDto, user: JwtPayload): Promise<PlaylistResponseDto> {
    const playlist = await this.repository.create(user.userId, dto);
    return { ...playlist, episodeCount: 0 };
  }

  async update(id: string, dto: UpdatePlaylistDto, user: JwtPayload): Promise<PlaylistResponseDto> {
    const playlist = await this.repository.update(id, user.userId, dto);
    return playlist as any;
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    await this.repository.delete(id, user.userId);
  }

  async addEpisode(id: string, dto: AddEpisodeToPlaylistDto, user: JwtPayload): Promise<void> {
    // Verify playlist exists and belongs to user
    const playlist = await this.repository.findById(id, user.userId);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    // Check if episode already in playlist
    const exists = await this.repository.isEpisodeInPlaylist(id, dto.episodeId);
    if (exists) {
      throw new BadRequestException('Episode already in playlist');
    }

    await this.repository.addEpisode(id, dto.episodeId, dto.order ?? 0);
  }

  async removeEpisode(id: string, episodeId: string, user: JwtPayload): Promise<void> {
    // Verify playlist exists and belongs to user
    const playlist = await this.repository.findById(id, user.userId);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    await this.repository.removeEpisode(id, episodeId);
  }

  async reorderEpisodes(
    id: string,
    episodeOrders: Array<{ episodeId: string; order: number }>,
    user: JwtPayload,
  ): Promise<void> {
    // Verify playlist exists and belongs to user
    const playlist = await this.repository.findById(id, user.userId);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    await this.repository.reorderEpisodes(id, episodeOrders);
  }
}
