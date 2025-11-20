import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class CollaborationService {
  constructor(private readonly prisma: PrismaService) {}

  async invite(podcastId: string, userId: string, role: string, permissions?: any) {
    return this.prisma.podcastCollaborator.create({
      data: { podcastId, userId, role, permissions, status: 'pending' },
    });
  }

  async accept(id: string, userId: string) {
    return this.prisma.podcastCollaborator.updateMany({
      where: { id, userId, status: 'pending' },
      data: { status: 'accepted', acceptedAt: new Date() },
    });
  }

  async reject(id: string, userId: string) {
    return this.prisma.podcastCollaborator.updateMany({
      where: { id, userId, status: 'pending' },
      data: { status: 'rejected' },
    });
  }

  async getCollaborators(podcastId: string) {
    return this.prisma.podcastCollaborator.findMany({
      where: { podcastId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });
  }

  async remove(id: string, podcastOwnerId: string) {
    const collab = await this.prisma.podcastCollaborator.findUnique({
      where: { id },
      include: { podcast: { select: { ownerId: true } } },
    });
    if (collab?.podcast.ownerId === podcastOwnerId) {
      return this.prisma.podcastCollaborator.delete({ where: { id } });
    }
    throw new Error('Unauthorized');
  }
}
