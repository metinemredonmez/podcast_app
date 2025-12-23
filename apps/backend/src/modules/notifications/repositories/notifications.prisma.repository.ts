import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma.service';
import {
  NotificationsRepository,
  NotificationModel,
  FindNotificationsOptions,
  CreateNotificationInput,
} from './notifications.repository';

@Injectable()
export class NotificationsPrismaRepository implements NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<NotificationModel | null> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
    return notification ? this.mapToModel(notification) : null;
  }

  async findMany(options: FindNotificationsOptions): Promise<NotificationModel[]> {
    const {
      tenantId,
      userId,
      isRead,
      type,
      page = 1,
      limit = 20,
      orderDirection = 'desc',
    } = options;

    const where: Prisma.NotificationWhereInput = {
      tenantId,
      userId,
      ...(isRead !== undefined && { isRead }),
      ...(type && { type }),
    };

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: orderDirection },
      skip: (page - 1) * limit,
      take: limit,
    });

    return notifications.map((n) => this.mapToModel(n));
  }

  async count(options: FindNotificationsOptions): Promise<number> {
    const { tenantId, userId, isRead, type } = options;

    const where: Prisma.NotificationWhereInput = {
      tenantId,
      userId,
      ...(isRead !== undefined && { isRead }),
      ...(type && { type }),
    };

    return this.prisma.notification.count({ where });
  }

  async countUnread(userId: string, tenantId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, tenantId, isRead: false },
    });
  }

  async create(data: CreateNotificationInput): Promise<NotificationModel> {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data ?? Prisma.JsonNull,
        isRead: false,
      },
    });

    return this.mapToModel(notification);
  }

  async createMany(data: CreateNotificationInput[]): Promise<number> {
    const result = await this.prisma.notification.createMany({
      data: data.map((d) => ({
        tenantId: d.tenantId,
        userId: d.userId,
        type: d.type,
        title: d.title,
        body: d.body,
        data: d.data ?? Prisma.JsonNull,
        isRead: false,
      })),
    });

    return result.count;
  }

  async markAsRead(id: string, tenantId: string): Promise<NotificationModel> {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.mapToModel(notification);
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, tenantId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.notification.delete({ where: { id } });
  }

  async deleteOlderThan(userId: string, tenantId: string, date: Date): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
        tenantId,
        createdAt: { lt: date },
      },
    });

    return result.count;
  }

  private mapToModel(notification: Prisma.NotificationGetPayload<object>): NotificationModel {
    return {
      id: notification.id,
      tenantId: notification.tenantId,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, unknown> | null,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
