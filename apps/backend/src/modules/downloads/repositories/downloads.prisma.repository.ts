import { Injectable, NotFoundException } from '@nestjs/common';
import { Download } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma.service';
import { IDownloadsRepository } from './downloads.repository';
import { CreateDownloadDto } from '../dto/create-download.dto';

@Injectable()
export class DownloadsPrismaRepository implements IDownloadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<Download[]> {
    return this.prisma.download.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
    });
  }

  async findById(id: string, userId: string): Promise<Download | null> {
    return this.prisma.download.findFirst({
      where: { id, userId },
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
    });
  }

  async findByEpisodeId(userId: string, episodeId: string): Promise<Download | null> {
    return this.prisma.download.findFirst({
      where: { userId, episodeId },
    });
  }

  async create(userId: string, dto: CreateDownloadDto): Promise<Download> {
    // Check if download already exists
    const existing = await this.findByEpisodeId(userId, dto.episodeId);
    if (existing) {
      return existing;
    }

    return this.prisma.download.create({
      data: {
        userId,
        episodeId: dto.episodeId,
        status: 'pending',
      },
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
    });
  }

  async updateStatus(
    id: string,
    status: string,
    downloadUrl?: string,
    fileSize?: bigint,
  ): Promise<Download> {
    return this.prisma.download.update({
      where: { id },
      data: {
        status,
        downloadUrl,
        fileSize,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const download = await this.findById(id, userId);
    if (!download) {
      throw new NotFoundException('Download not found');
    }

    await this.prisma.download.delete({ where: { id } });
  }
}
