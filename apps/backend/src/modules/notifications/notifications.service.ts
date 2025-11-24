import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { NotificationQueueService } from '../../jobs/queues/notification.queue';
import { NotificationsGateway } from '../../ws/gateways/notifications.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { MarkNotificationReadDto } from './dto/mark-notification-read.dto';
import { NotificationJobPayload } from './interfaces/notification-job-payload.interface';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: NotificationQueueService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async findAll(query: ListNotificationsDto, actor: JwtPayload): Promise<{ data: Notification[]; total: number; page: number; limit: number }> {
    const tenantId = this.resolveTenant(query.tenantId, actor, true);
    const userFilter = query.userId
      ? this.resolveUser(query.userId, actor)
      : actor.role === UserRole.ADMIN
      ? undefined
      : actor.sub;

    const where: Prisma.NotificationWhereInput = {
      tenantId,
      ...(userFilter ? { userId: userFilter } : {}),
      ...(query.unreadOnly ? { readAt: null } : {}),
    };

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(tenantId: string, id: string, actor: JwtPayload): Promise<Notification> {
    const resolvedTenant = this.resolveTenant(tenantId, actor, true);
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId: resolvedTenant },
    });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found.`);
    }
    this.ensureNotificationAccess(actor, notification);
    return notification;
  }

  async create(dto: CreateNotificationDto, actor: JwtPayload): Promise<Notification> {
    this.ensureAdmin(actor);
    const tenantId = this.resolveTenant(dto.tenantId, actor, true);
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        userId: dto.userId,
        type: dto.type,
        payload: dto.payload as Prisma.JsonValue,
      },
    });

    this.gateway.emitNotification(notification);
    return notification;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateNotificationDto,
    actor: JwtPayload,
  ): Promise<Notification> {
    this.ensureAdmin(actor);
    const notification = await this.findOne(tenantId, id, actor);

    const readAt =
      dto.read === undefined
        ? notification.readAt
        : dto.read
        ? new Date()
        : null;

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        ...(dto.payload ? { payload: dto.payload as Prisma.JsonValue } : {}),
        readAt,
      },
    });

    this.gateway.emitNotification(updated);
    return updated;
  }

  async markAsRead(
    notificationId: string,
    dto: MarkNotificationReadDto,
    actor: JwtPayload,
  ): Promise<Notification> {
    const tenantId = this.resolveTenant(dto.tenantId, actor, true);
    const userId = this.resolveUser(dto.userId, actor);
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        tenantId,
        userId,
      },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Notification ${notificationId} not found.`);
    }

    const updated = await this.findOne(tenantId, notificationId, actor);
    this.gateway.emitNotification(updated);
    return updated;
  }

  async markAllAsRead(dto: MarkNotificationReadDto, actor: JwtPayload) {
    const tenantId = this.resolveTenant(dto.tenantId, actor, true);
    const userId = this.resolveUser(dto.userId, actor);
    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId,
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    if (result.count > 0) {
      const updatedNotifications = await this.prisma.notification.findMany({
        where: { tenantId, userId, readAt: { not: null } },
        orderBy: { updatedAt: 'desc' },
        take: result.count,
      });
      updatedNotifications.forEach((notification) => this.gateway.emitNotification(notification));
    }
    return { updated: result.count };
  }

  async delete(tenantId: string, id: string, actor: JwtPayload): Promise<void> {
    this.ensureAdmin(actor);
    await this.findOne(tenantId, id, actor);
    await this.prisma.notification.delete({ where: { id } });
  }

  async send(dto: SendNotificationDto, actor: JwtPayload): Promise<void> {
    this.ensureAdmin(actor);
    const tenantId = this.resolveTenant(dto.tenantId, actor, true);
    const payload: NotificationJobPayload = {
      tenantId,
      userId: dto.userId,
      type: dto.type,
      payload: dto.payload,
    };

    await this.queue.enqueue(payload);
  }

  private resolveTenant(requestedTenantId: string | undefined, actor: JwtPayload, allowAdminOverride: boolean): string {
    if (!requestedTenantId) {
      return actor.tenantId;
    }
    if (requestedTenantId === actor.tenantId) {
      return requestedTenantId;
    }
    if (allowAdminOverride && actor.role === UserRole.ADMIN) {
      return requestedTenantId;
    }
    throw new ForbiddenException('Access to the requested tenant is not permitted.');
  }

  private resolveUser(requestedUserId: string | undefined, actor: JwtPayload): string {
    if (!requestedUserId || requestedUserId === actor.sub) {
      return actor.sub;
    }
    if (actor.role === UserRole.ADMIN) {
      return requestedUserId;
    }
    throw new ForbiddenException('Cannot manage notifications for another user.');
  }

  private ensureNotificationAccess(actor: JwtPayload, notification: Notification) {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (notification.tenantId !== actor.tenantId || notification.userId !== actor.sub) {
      throw new ForbiddenException('You do not have access to this notification.');
    }
  }

  private ensureAdmin(actor: JwtPayload) {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins may perform this action.');
    }
  }
}
