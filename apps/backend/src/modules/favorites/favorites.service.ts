import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { FavoriteResponseDto } from './dto/favorite-response.dto';

interface UserContext {
  userId: string;
  tenantId: string;
}

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: UserContext): Promise<FavoriteResponseDto[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        podcast: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImageUrl: true,
          },
        },
        episode: {
          select: {
            id: true,
            title: true,
            slug: true,
            duration: true,
            audioUrl: true,
            podcast: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return favorites.map((fav) => ({
      id: fav.id,
      userId: fav.userId,
      podcastId: fav.podcastId,
      episodeId: fav.episodeId,
      createdAt: fav.createdAt,
      podcast: fav.podcast
        ? {
            id: fav.podcast.id,
            title: fav.podcast.title,
            slug: fav.podcast.slug,
            coverImageUrl: fav.podcast.coverImageUrl,
          }
        : undefined,
      episode: fav.episode
        ? {
            id: fav.episode.id,
            title: fav.episode.title,
            slug: fav.episode.slug,
            duration: fav.episode.duration,
            audioUrl: fav.episode.audioUrl,
            podcast: fav.episode.podcast
              ? {
                  id: fav.episode.podcast.id,
                  title: fav.episode.podcast.title,
                }
              : undefined,
          }
        : undefined,
    }));
  }

  async add(dto: AddFavoriteDto, user: UserContext): Promise<FavoriteResponseDto> {
    // Validate that at least one ID is provided
    if (!dto.podcastId && !dto.episodeId) {
      throw new BadRequestException('Either podcastId or episodeId must be provided');
    }

    // Check if already favorited
    const existing = await this.prisma.favorite.findFirst({
      where: {
        userId: user.userId,
        podcastId: dto.podcastId || null,
        episodeId: dto.episodeId || null,
      },
    });

    if (existing) {
      throw new BadRequestException('Already added to favorites');
    }

    // Verify podcast exists if podcastId is provided
    if (dto.podcastId) {
      const podcast = await this.prisma.podcast.findUnique({
        where: { id: dto.podcastId },
      });
      if (!podcast) {
        throw new NotFoundException('Podcast not found');
      }
    }

    // Verify episode exists if episodeId is provided
    if (dto.episodeId) {
      const episode = await this.prisma.episode.findUnique({
        where: { id: dto.episodeId },
      });
      if (!episode) {
        throw new NotFoundException('Episode not found');
      }
    }

    // Create favorite
    const favorite = await this.prisma.favorite.create({
      data: {
        userId: user.userId,
        podcastId: dto.podcastId || null,
        episodeId: dto.episodeId || null,
      },
      include: {
        podcast: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImageUrl: true,
          },
        },
        episode: {
          select: {
            id: true,
            title: true,
            slug: true,
            duration: true,
            audioUrl: true,
            podcast: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return {
      id: favorite.id,
      userId: favorite.userId,
      podcastId: favorite.podcastId,
      episodeId: favorite.episodeId,
      createdAt: favorite.createdAt,
      podcast: favorite.podcast
        ? {
            id: favorite.podcast.id,
            title: favorite.podcast.title,
            slug: favorite.podcast.slug,
            coverImageUrl: favorite.podcast.coverImageUrl,
          }
        : undefined,
      episode: favorite.episode
        ? {
            id: favorite.episode.id,
            title: favorite.episode.title,
            slug: favorite.episode.slug,
            duration: favorite.episode.duration,
            audioUrl: favorite.episode.audioUrl,
            podcast: favorite.episode.podcast
              ? {
                  id: favorite.episode.podcast.id,
                  title: favorite.episode.podcast.title,
                }
              : undefined,
          }
        : undefined,
    };
  }

  async remove(id: string, user: UserContext): Promise<void> {
    const favorite = await this.prisma.favorite.findUnique({
      where: { id },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    if (favorite.userId !== user.userId) {
      throw new BadRequestException('You can only remove your own favorites');
    }

    await this.prisma.favorite.delete({
      where: { id },
    });
  }

  async checkIsFavorited(
    podcastId: string | undefined,
    episodeId: string | undefined,
    user: UserContext,
  ): Promise<{ isFavorited: boolean; favoriteId?: string }> {
    if (!podcastId && !episodeId) {
      return { isFavorited: false };
    }

    const favorite = await this.prisma.favorite.findFirst({
      where: {
        userId: user.userId,
        podcastId: podcastId || null,
        episodeId: episodeId || null,
      },
    });

    return {
      isFavorited: !!favorite,
      favoriteId: favorite?.id,
    };
  }
}
