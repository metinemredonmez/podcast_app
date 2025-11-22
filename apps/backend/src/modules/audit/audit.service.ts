import { Injectable, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { FilterAuditDto } from './dto/filter-audit.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';

export interface CreateAuditLogData {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: FilterAuditDto): Prisma.AuditLogWhereInput {
    return {
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.action ? { action: filter.action } : {}),
      ...(filter.entityType ? { entityType: filter.entityType } : {}),
      ...(filter.entityId ? { entityId: filter.entityId } : {}),
      ...(filter.from || filter.to
        ? {
            createdAt: {
              ...(filter.from ? { gte: new Date(filter.from) } : {}),
              ...(filter.to ? { lte: new Date(filter.to) } : {}),
            },
          }
        : {}),
    };
  }

  async findAll(filter: FilterAuditDto, actor: JwtPayload): Promise<AuditLogResponseDto[]> {
    // Only ADMIN can view audit logs
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can view audit logs');
    }

    const logs = await this.prisma.auditLog.findMany({
      where: this.buildWhere(filter),
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return logs as any;
  }

  async findOne(id: string, actor: JwtPayload): Promise<AuditLogResponseDto> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can view audit logs');
    }

    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    return log as any;
  }

  async create(data: CreateAuditLogData): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    changes?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.create({
      userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress,
      userAgent,
    }).catch((error) => {
      // Log error but don't fail the request
      this.logger.error('Failed to create audit log', error);
    });
  }
}
