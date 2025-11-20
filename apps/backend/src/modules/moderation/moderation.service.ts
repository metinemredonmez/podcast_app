import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async reportContent(data: { entityType: string; entityId: string; reportedBy?: string; reason?: string }) {
    return this.prisma.moderationQueue.create({ data });
  }

  async getQueue(status?: string) {
    return this.prisma.moderationQueue.findMany({
      where: status ? { status } : {},
      include: { reportedUser: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderate(id: string, moderatedBy: string, action: 'approved' | 'rejected', notes?: string) {
    return this.prisma.moderationQueue.update({
      where: { id },
      data: { status: action, moderatedBy, moderatedAt: new Date(), notes },
    });
  }
}
