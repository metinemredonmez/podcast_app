// User roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  HOCA = 'HOCA',
  CREATOR = 'HOCA', // CREATOR is alias for HOCA
  USER = 'USER',
  GUEST = 'GUEST',
}

export const UserRoleValues = Object.values(UserRole);

// Notification types
export enum NotificationType {
  NEW_EPISODE = 'NEW_EPISODE',
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_REVIEW = 'NEW_REVIEW',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  EPISODE_APPROVED = 'EPISODE_APPROVED',
  EPISODE_REJECTED = 'EPISODE_REJECTED',
  SYSTEM = 'SYSTEM',
}

export const NotificationTypeValues = Object.values(NotificationType);

// Analytics event types
export enum AnalyticsEventType {
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  COMPLETE = 'COMPLETE',
  SKIP = 'SKIP',
  DOWNLOAD = 'DOWNLOAD',
  SHARE = 'SHARE',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  SUBSCRIBE = 'SUBSCRIBE',
}

export const AnalyticsEventTypeValues = Object.values(AnalyticsEventType);

// Enums defined in Prisma schema
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

// Media Type for Podcasts
export enum MediaType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  BOTH = 'BOTH',
}

export const MediaTypeValues = Object.values(MediaType);

// Media Quality
export enum MediaQuality {
  SD = 'SD',
  HD = 'HD',
  FULL_HD = 'FULL_HD',
  UHD_4K = 'UHD_4K',
}

export const MediaQualityValues = Object.values(MediaQuality);
