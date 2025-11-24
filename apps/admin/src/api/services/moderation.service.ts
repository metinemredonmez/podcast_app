import apiClient from '../client';

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
export type EntityType = 'podcast' | 'episode' | 'comment' | 'user';

export interface ModerationUser {
  id: string;
  name: string;
  email: string;
}

export interface ModerationItem {
  id: string;
  tenantId?: string;
  entityType: string;
  entityId: string;
  reason?: string;
  status: ModerationStatus;
  priority: number;
  notes?: string;
  reportedBy?: string;
  reportedUser?: ModerationUser;
  moderatedBy?: string;
  moderator?: ModerationUser;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields for detail view
  contentPreview?: string;
  reportCount?: number;
  reportHistory?: ReportHistoryItem[];
}

export interface ReportHistoryItem {
  id: string;
  reason: string;
  reportedBy: string;
  reporterName: string;
  createdAt: string;
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  escalated: number;
  total: number;
  resolvedToday?: number;
  avgResolutionTime?: number; // in minutes
}

export interface ModerationQueueParams {
  status?: ModerationStatus;
  type?: EntityType;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface ModerationQueueResponse {
  data: ModerationItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ReportContentDto {
  entityType: string;
  entityId: string;
  reason?: string;
}

export interface ModerationActionDto {
  action: 'APPROVED' | 'REJECTED';
  notes?: string;
}

export interface WarnUserDto {
  userId: string;
  reason: string;
  moderationItemId?: string;
}

export interface EscalateDto {
  notes?: string;
}

export interface SetPriorityDto {
  priority: number;
}

export const moderationService = {
  /**
   * Get moderation queue with filters and pagination
   */
  async getQueue(params?: ModerationQueueParams): Promise<ModerationItem[]> {
    const response = await apiClient.get('/moderation/queue', { params });
    // Handle both array and paginated response
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  },

  /**
   * Get moderation queue with full pagination info
   */
  async getQueuePaginated(params?: ModerationQueueParams): Promise<ModerationQueueResponse> {
    const response = await apiClient.get('/moderation/queue', { params });
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        total: response.data.length,
        page: params?.page || 1,
        limit: params?.limit || 10,
      };
    }
    return response.data;
  },

  /**
   * Get single moderation item with full details
   */
  async getById(id: string): Promise<ModerationItem> {
    const response = await apiClient.get(`/moderation/queue/${id}`);
    return response.data;
  },

  /**
   * Get moderation statistics
   */
  async getStats(): Promise<ModerationStats> {
    const response = await apiClient.get('/moderation/stats');
    return response.data;
  },

  /**
   * Report content for moderation
   */
  async reportContent(dto: ReportContentDto): Promise<ModerationItem> {
    const response = await apiClient.post('/moderation/report', dto);
    return response.data;
  },

  /**
   * Approve or reject content
   */
  async moderate(id: string, dto: ModerationActionDto): Promise<ModerationItem> {
    const response = await apiClient.patch(`/moderation/${id}/moderate`, dto);
    return response.data;
  },

  /**
   * Warn a user
   */
  async warnUser(dto: WarnUserDto): Promise<void> {
    await apiClient.post('/moderation/warn-user', dto);
  },

  /**
   * Escalate moderation item
   */
  async escalate(id: string, dto: EscalateDto): Promise<ModerationItem> {
    const response = await apiClient.patch(`/moderation/${id}/escalate`, dto);
    return response.data;
  },

  /**
   * Set priority for moderation item
   */
  async setPriority(id: string, dto: SetPriorityDto): Promise<ModerationItem> {
    const response = await apiClient.patch(`/moderation/${id}/priority`, dto);
    return response.data;
  },

  /**
   * Delete moderation item
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/moderation/${id}`);
  },

  /**
   * Get report history for an entity
   */
  async getReportHistory(entityType: string, entityId: string): Promise<ReportHistoryItem[]> {
    const response = await apiClient.get(`/moderation/history/${entityType}/${entityId}`);
    return response.data;
  },
};

export default moderationService;
