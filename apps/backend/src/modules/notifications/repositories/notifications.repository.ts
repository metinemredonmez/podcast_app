import { NotificationType } from '@prisma/client';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export interface NotificationModel {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface FindNotificationsOptions {
  tenantId: string;
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationsRepository {
  findById(id: string, tenantId: string): Promise<NotificationModel | null>;
  findMany(options: FindNotificationsOptions): Promise<NotificationModel[]>;
  count(options: FindNotificationsOptions): Promise<number>;
  countUnread(userId: string, tenantId: string): Promise<number>;
  create(data: CreateNotificationInput): Promise<NotificationModel>;
  createMany(data: CreateNotificationInput[]): Promise<number>;
  markAsRead(id: string, tenantId: string): Promise<NotificationModel>;
  markAllAsRead(userId: string, tenantId: string): Promise<number>;
  delete(id: string, tenantId: string): Promise<void>;
  deleteOlderThan(userId: string, tenantId: string, date: Date): Promise<number>;
}
