import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { CollaboratorRole, CollaboratorStatus } from '../../common/enums/prisma.enums';
import { UpdateCollaboratorDto } from './dto/update-collaborator.dto';

@Injectable()
export class CollaborationService {
  constructor(private readonly prisma: PrismaService) {}

  async invite(
    podcastId: string,
    userId: string,
    role: CollaboratorRole,
    permissions?: Record<string, boolean>,
    invitedBy?: string,
  ) {
    // Check if already invited
    const existing = await this.prisma.podcastCollaborator.findUnique({
      where: { podcastId_userId: { podcastId, userId } },
    });

    if (existing) {
      throw new ConflictException('User is already a collaborator or has a pending invitation');
    }

    return this.prisma.podcastCollaborator.create({
      data: {
        podcastId,
        userId,
        role,
        permissions,
        status: CollaboratorStatus.PENDING,
        invitedBy,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async accept(id: string, userId: string) {
    const collab = await this.getById(id);

    if (collab.userId !== userId) {
      throw new ForbiddenException('You can only accept your own invitations');
    }

    if (collab.status !== CollaboratorStatus.PENDING) {
      throw new ForbiddenException('This invitation has already been processed');
    }

    return this.prisma.podcastCollaborator.update({
      where: { id },
      data: { status: CollaboratorStatus.ACCEPTED, acceptedAt: new Date() },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async reject(id: string, userId: string) {
    const collab = await this.getById(id);

    if (collab.userId !== userId) {
      throw new ForbiddenException('You can only reject your own invitations');
    }

    if (collab.status !== CollaboratorStatus.PENDING) {
      throw new ForbiddenException('This invitation has already been processed');
    }

    return this.prisma.podcastCollaborator.update({
      where: { id },
      data: { status: CollaboratorStatus.REJECTED },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async getCollaborators(podcastId: string) {
    return this.prisma.podcastCollaborator.findMany({
      where: { podcastId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { invitedAt: 'desc' },
    });
  }

  async getById(id: string) {
    const collab = await this.prisma.podcastCollaborator.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        podcast: { select: { id: true, title: true, ownerId: true } },
      },
    });

    if (!collab) {
      throw new NotFoundException('Collaborator not found');
    }

    return collab;
  }

  async update(id: string, dto: UpdateCollaboratorDto, requesterId: string) {
    const collab = await this.getById(id);

    // Only podcast owner can update collaborator roles/permissions
    if (collab.podcast.ownerId !== requesterId) {
      throw new ForbiddenException('Only podcast owner can update collaborator settings');
    }

    return this.prisma.podcastCollaborator.update({
      where: { id },
      data: {
        ...(dto.role && { role: dto.role }),
        ...(dto.permissions && { permissions: dto.permissions }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async remove(id: string, requesterId: string) {
    const collab = await this.getById(id);

    // Allow podcast owner or the collaborator themselves to remove
    if (collab.podcast.ownerId !== requesterId && collab.userId !== requesterId) {
      throw new ForbiddenException('You are not authorized to remove this collaborator');
    }

    await this.prisma.podcastCollaborator.delete({ where: { id } });
  }

  async getMyInvitations(userId: string) {
    return this.prisma.podcastCollaborator.findMany({
      where: { userId, status: CollaboratorStatus.PENDING },
      include: {
        podcast: { select: { id: true, title: true, coverImageUrl: true } },
      },
      orderBy: { invitedAt: 'desc' },
    });
  }
}
