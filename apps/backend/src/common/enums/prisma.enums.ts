// Re-export from shared-types
export {
  UserRole,
  UserRoleValues,
  NotificationType,
  NotificationTypeValues,
  AnalyticsEventType,
  AnalyticsEventTypeValues,
} from '@podcast-app/shared-types';

// New enums defined in Prisma schema
export enum DownloadStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export const DownloadStatusValues = Object.values(DownloadStatus);

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
}

export const ModerationStatusValues = Object.values(ModerationStatus);

export enum ScheduleStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export const ScheduleStatusValues = Object.values(ScheduleStatus);

export enum CollaboratorRole {
  CO_HOST = 'CO_HOST',
  EDITOR = 'EDITOR',
  CONTRIBUTOR = 'CONTRIBUTOR',
  GUEST = 'GUEST',
}

export const CollaboratorRoleValues = Object.values(CollaboratorRole);

export enum CollaboratorStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  REMOVED = 'REMOVED',
}

export const CollaboratorStatusValues = Object.values(CollaboratorStatus);

export enum StreamStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export const StreamStatusValues = Object.values(StreamStatus);
