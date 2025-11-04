import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: NotificationQueueService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async findAll(query: ListNotificationsDto): Promise<Notification[]> {
    const where: Prisma.NotificationWhereInput = {
      tenantId: query.tenantId,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.unreadOnly ? { readAt: null } : {}),
    };

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found.`);
    }
    return notification;
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: dto.tenantId,
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
  ): Promise<Notification> {
    const notification = await this.findOne(tenantId, id);

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
  ): Promise<Notification> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        tenantId: dto.tenantId,
        userId: dto.userId,
      },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Notification ${notificationId} not found.`);
    }

    const updated = await this.findOne(dto.tenantId, notificationId);
    this.gateway.emitNotification(updated);
    return updated;
  }

  async markAllAsRead(dto: MarkNotificationReadDto) {
    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    if (result.count > 0) {
      const updatedNotifications = await this.prisma.notification.findMany({
        where: { tenantId: dto.tenantId, userId: dto.userId, readAt: { not: null } },
        orderBy: { updatedAt: 'desc' },
        take: result.count,
      });
      updatedNotifications.forEach((notification) => this.gateway.emitNotification(notification));
    }
    return { updated: result.count };
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.notification.delete({ where: { id } });
  }

  async send(dto: SendNotificationDto): Promise<void> {
    const payload: NotificationJobPayload = {
      tenantId: dto.tenantId,
      userId: dto.userId,
      type: dto.type,
      payload: dto.payload,
    };

    await this.queue.enqueue(payload);
  }
}
