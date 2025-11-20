import { Injectable, NotFoundException } from '@nestjs/common';
import { Playlist, PlaylistEpisode } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma.service';
import { IPlaylistsRepository } from './playlists.repository';
import { CreatePlaylistDto } from '../dto/create-playlist.dto';
import { UpdatePlaylistDto } from '../dto/update-playlist.dto';

@Injectable()
export class PlaylistsPrismaRepository implements IPlaylistsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<Playlist[]> {
    return this.prisma.playlist.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { episodes: true },
        },
      },
    });
  }

  async findById(id: string, userId: string): Promise<Playlist | null> {
    return this.prisma.playlist.findFirst({
      where: { id, userId },
    });
  }

  async findByIdWithEpisodes(id: string, userId: string): Promise<Playlist | null> {
    return this.prisma.playlist.findFirst({
      where: { id, userId },
      include: {
        episodes: {
          orderBy: { order: 'asc' },
          include: {
            episode: {
              include: {
                podcast: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async create(userId: string, dto: CreatePlaylistDto): Promise<Playlist> {
    return this.prisma.playlist.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        coverUrl: dto.coverUrl,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdatePlaylistDto): Promise<Playlist> {
    const playlist = await this.findById(id, userId);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    return this.prisma.playlist.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic,
        coverUrl: dto.coverUrl,
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const playlist = await this.findById(id, userId);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    await this.prisma.playlist.delete({ where: { id } });
  }

  async addEpisode(playlistId: string, episodeId: string, order: number): Promise<PlaylistEpisode> {
    // Check if episode already exists in playlist
    const existing = await this.prisma.playlistEpisode.findUnique({
      where: {
        playlistId_episodeId: {
          playlistId,
          episodeId,
        },
      },
    });

    if (existing) {
      // Update order if already exists
      return this.prisma.playlistEpisode.update({
        where: { id: existing.id },
        data: { order },
      });
    }

    return this.prisma.playlistEpisode.create({
      data: {
        playlistId,
        episodeId,
        order,
      },
    });
  }

  async removeEpisode(playlistId: string, episodeId: string): Promise<void> {
    await this.prisma.playlistEpisode.deleteMany({
      where: {
        playlistId,
        episodeId,
      },
    });
  }

  async isEpisodeInPlaylist(playlistId: string, episodeId: string): Promise<boolean> {
    const count = await this.prisma.playlistEpisode.count({
      where: {
        playlistId,
        episodeId,
      },
    });
    return count > 0;
  }

  async reorderEpisodes(
    playlistId: string,
    episodeOrders: Array<{ episodeId: string; order: number }>,
  ): Promise<void> {
    // Update each episode's order in a transaction
    await this.prisma.$transaction(
      episodeOrders.map(({ episodeId, order }) =>
        this.prisma.playlistEpisode.updateMany({
          where: {
            playlistId,
            episodeId,
          },
          data: { order },
        }),
      ),
    );
  }
}
