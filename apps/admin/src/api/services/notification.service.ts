import { apiClient } from '../client';

export type NotificationType = 'push' | 'email' | 'in-app' | 'all';
export type NotificationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
export type RecipientType = 'all' | 'tenant' | 'role' | 'custom' | 'subscribers';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  recipientType: RecipientType;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  deliveryRate: number; // percentage
  openRate: number; // percentage
  clickRate: number; // percentage
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
  metadata?: {
    tenantId?: string;
    role?: string;
    userIds?: string[];
    podcastId?: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  type: NotificationType;
  createdAt: string;
  updatedAt: string;
}

export interface SendNotificationRequest {
  title: string;
  body: string;
  type: NotificationType;
  recipientType: RecipientType;
  metadata?: {
    tenantId?: string;
    role?: string;
    userIds?: string[];
    podcastId?: string;
  };
  scheduledAt?: string;
  saveAsTemplate?: boolean;
  templateName?: string;
}

export interface NotificationStats {
  id: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  failedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  recipientBreakdown: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export interface NotificationsListParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  status?: NotificationStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationsListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

export const notificationService = {
  async getNotifications(params: NotificationsListParams = {}): Promise<NotificationsListResponse> {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  async getNotification(id: string): Promise<Notification> {
    const response = await apiClient.get(`/notifications/${id}`);
    return response.data;
  },

  async sendNotification(data: SendNotificationRequest): Promise<Notification> {
    const response = await apiClient.post('/notifications/send', data);
    return response.data;
  },

  async getStats(id: string): Promise<NotificationStats> {
    const response = await apiClient.get(`/notifications/${id}/stats`);
    return response.data;
  },

  async getTemplates(): Promise<NotificationTemplate[]> {
    const response = await apiClient.get('/notifications/templates');
    return response.data;
  },

  async createTemplate(data: {
    name: string;
    title: string;
    body: string;
    type: NotificationType;
  }): Promise<NotificationTemplate> {
    const response = await apiClient.post('/notifications/templates', data);
    return response.data;
  },

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/notifications/templates/${id}`);
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  async cancelScheduled(id: string): Promise<void> {
    await apiClient.post(`/notifications/${id}/cancel`);
  },

  async getRecipientCount(data: {
    recipientType: RecipientType;
    metadata?: SendNotificationRequest['metadata'];
  }): Promise<number> {
    const response = await apiClient.post('/notifications/recipient-count', data);
    return response.data.count;
  },
};
