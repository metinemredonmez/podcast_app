import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ModerationStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';

export interface ReportContentDto {
  entityType: string;
  entityId: string;
  reportedBy?: string;
  reason?: string;
  tenantId?: string;
}

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async reportContent(data: ReportContentDto) {
    // Check if already reported
    const existing = await this.prisma.moderationQueue.findFirst({
      where: {
        entityType: data.entityType,
        entityId: data.entityId,
        status: ModerationStatus.PENDING,
      },
    });

    if (existing) {
      // Update existing report with new reason if provided
      return this.prisma.moderationQueue.update({
        where: { id: existing.id },
        data: {
          reason: data.reason ? `${existing.reason}\n---\n${data.reason}` : existing.reason,
        },
      });
    }

    return this.prisma.moderationQueue.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        reportedBy: data.reportedBy,
        reason: data.reason,
        tenantId: data.tenantId,
        status: ModerationStatus.PENDING,
      },
    });
  }

  async getQueue(status?: ModerationStatus, tenantId?: string) {
    return this.prisma.moderationQueue.findMany({
      where: {
        ...(status && { status }),
        ...(tenantId && { tenantId }),
      },
      include: {
        reportedUser: { select: { id: true, name: true, email: true } },
        moderator: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getById(id: string) {
    const item = await this.prisma.moderationQueue.findUnique({
      where: { id },
      include: {
        reportedUser: { select: { id: true, name: true, email: true } },
        moderator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Moderation item not found');
    }

    return item;
  }

  async moderate(
    id: string,
    moderatedBy: string,
    action: ModerationStatus.APPROVED | ModerationStatus.REJECTED,
    notes?: string,
  ) {
    const item = await this.getById(id);

    if (item.status !== ModerationStatus.PENDING) {
      throw new ForbiddenException('This item has already been moderated');
    }

    return this.prisma.moderationQueue.update({
      where: { id },
      data: {
        status: action,
        moderatedBy,
        moderatedAt: new Date(),
        notes,
      },
    });
  }

  async escalate(id: string, moderatedBy: string, notes?: string) {
    const item = await this.getById(id);

    return this.prisma.moderationQueue.update({
      where: { id },
      data: {
        status: ModerationStatus.ESCALATED,
        priority: item.priority + 1,
        moderatedBy,
        notes,
        updatedAt: new Date(),
      },
    });
  }

  async setPriority(id: string, priority: number) {
    return this.prisma.moderationQueue.update({
      where: { id },
      data: { priority },
    });
  }

  async getStats(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};

    const [pending, approved, rejected, escalated] = await Promise.all([
      this.prisma.moderationQueue.count({ where: { ...where, status: ModerationStatus.PENDING } }),
      this.prisma.moderationQueue.count({ where: { ...where, status: ModerationStatus.APPROVED } }),
      this.prisma.moderationQueue.count({ where: { ...where, status: ModerationStatus.REJECTED } }),
      this.prisma.moderationQueue.count({ where: { ...where, status: ModerationStatus.ESCALATED } }),
    ]);

    return {
      pending,
      approved,
      rejected,
      escalated,
      total: pending + approved + rejected + escalated,
    };
  }

  async delete(id: string): Promise<void> {
    const item = await this.prisma.moderationQueue.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Moderation item not found');
    }
    await this.prisma.moderationQueue.delete({ where: { id } });
  }
}
