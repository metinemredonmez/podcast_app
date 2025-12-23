/**
 * Frontend Type Definitions
 * These types mirror the backend Prisma models for type safety
 */

// ==================== ENUMS ====================

export type UserRole = 'ADMIN' | 'EDITOR' | 'CREATOR' | 'LISTENER';

export type NotificationType =
  | 'EPISODE_PUBLISHED'
  | 'COMMENT_REPLY'
  | 'SYSTEM'
  | 'NEW_FOLLOWER'
  | 'MENTION';

export type AnalyticsEventType =
  | 'PODCAST_PLAY'
  | 'PODCAST_COMPLETE'
  | 'PODCAST_FOLLOW'
  | 'PODCAST_SHARE'
  | 'STREAM_JOIN'
  | 'EPISODE_DOWNLOAD'
  | 'SEARCH_QUERY';

export type StreamStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

export type DownloadStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';

export type ScheduleStatus = 'PENDING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

export type CollaboratorRole = 'CO_HOST' | 'EDITOR' | 'CONTRIBUTOR' | 'GUEST';

export type CollaboratorStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REMOVED';

export type DevicePlatform = 'IOS' | 'ANDROID' | 'WEB';

export type PushProviderType = 'ONESIGNAL' | 'FIREBASE';

export type PushTargetType = 'ALL' | 'SEGMENT' | 'USER_IDS' | 'TOPIC';

export type PushStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'FAILED' | 'CANCELLED';

export type SocialProvider = 'GOOGLE' | 'APPLE' | 'FACEBOOK';

export type SmsProvider = 'NETGSM';

export type OtpType = 'ADMIN_LOGIN' | 'PHONE_VERIFY';

export type SmsType = 'OTP' | 'NOTIFICATION';

export type SmsStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export type LiveStreamStatus =
  | 'SCHEDULED'
  | 'PREPARING'
  | 'LIVE'
  | 'PAUSED'
  | 'ENDED'
  | 'CANCELLED';

// ==================== BASE TYPES ====================

export interface BaseModel {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== USER ====================

export interface User extends BaseModel {
  tenantId: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  avatarUrl: string | null;
  bio: string | null;
  preferences: Record<string, unknown> | null;
}

export interface UserListItem extends Pick<User, 'id' | 'email' | 'name' | 'role' | 'isActive' | 'avatarUrl' | 'createdAt'> {
  podcastCount?: number;
  followerCount?: number;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  bio?: string;
  avatarUrl?: string;
}

// ==================== TENANT ====================

export interface Tenant extends BaseModel {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  settings: Record<string, unknown> | null;
}

export interface TenantStats {
  userCount: number;
  podcastCount: number;
  episodeCount: number;
  totalPlays: number;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
}

export interface UpdateTenantDto {
  name?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
  settings?: Record<string, unknown>;
}

// ==================== PODCAST ====================

export interface Podcast extends BaseModel {
  tenantId: string;
  ownerId: string;
  hocaId: string | null;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  language: string | null;
  isPublished: boolean;
  isExplicit: boolean;
  publishedAt: string | null;
  owner?: User;
  hoca?: Hoca;
  categories?: Category[];
  _count?: {
    episodes: number;
    follows: number;
    reviews: number;
  };
}

export interface PodcastListItem extends Pick<Podcast,
  'id' | 'title' | 'slug' | 'description' | 'coverImageUrl' | 'isPublished' | 'createdAt'
> {
  owner: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  hoca?: Pick<Hoca, 'id' | 'name'>;
  episodeCount: number;
  followerCount: number;
  totalPlays: number;
}

export interface CreatePodcastDto {
  title: string;
  description?: string;
  coverImageUrl?: string;
  hocaId?: string;
  categoryIds?: string[];
  language?: string;
}

export interface UpdatePodcastDto {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  hocaId?: string;
  categoryIds?: string[];
  isPublished?: boolean;
  language?: string;
}

// ==================== EPISODE ====================

export interface Episode extends BaseModel {
  tenantId: string;
  podcastId: string;
  hostId: string | null;
  title: string;
  slug: string;
  description: string | null;
  duration: number;
  audioUrl: string;
  audioMimeType: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  isExplicit: boolean;
  episodeNumber: number | null;
  seasonNumber: number | null;
  podcast?: Podcast;
  host?: User;
}

export interface EpisodeListItem extends Pick<Episode,
  'id' | 'title' | 'slug' | 'duration' | 'isPublished' | 'publishedAt' | 'createdAt' | 'episodeNumber' | 'seasonNumber'
> {
  podcast: Pick<Podcast, 'id' | 'title' | 'coverImageUrl'>;
  playCount: number;
  downloadCount: number;
}

export interface CreateEpisodeDto {
  podcastId: string;
  title: string;
  description?: string;
  audioUrl: string;
  duration: number;
  episodeNumber?: number;
  seasonNumber?: number;
}

export interface UpdateEpisodeDto {
  title?: string;
  description?: string;
  audioUrl?: string;
  duration?: number;
  isPublished?: boolean;
  episodeNumber?: number;
  seasonNumber?: number;
}

// ==================== CATEGORY ====================

export interface Category extends BaseModel {
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
  _count?: {
    podcasts: number;
  };
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  iconUrl?: string;
  sortOrder?: number;
}

// ==================== HOCA ====================

export interface Hoca extends BaseModel {
  tenantId: string;
  userId: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  user?: User;
  _count?: {
    podcasts: number;
    liveStreams: number;
  };
}

export interface CreateHocaDto {
  userId: string;
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateHocaDto {
  name?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

// ==================== COMMENT ====================

export interface Comment extends BaseModel {
  tenantId: string;
  episodeId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isApproved: boolean;
  user?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  episode?: Pick<Episode, 'id' | 'title'>;
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface CreateCommentDto {
  episodeId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentDto {
  content?: string;
  isApproved?: boolean;
}

// ==================== REVIEW ====================

export interface Review extends BaseModel {
  tenantId: string;
  podcastId: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string | null;
  isApproved: boolean;
  user?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  podcast?: Pick<Podcast, 'id' | 'title' | 'coverImageUrl'>;
  _count?: {
    helpfulVotes: number;
  };
}

export interface CreateReviewDto {
  podcastId: string;
  rating: number;
  title?: string;
  content?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  title?: string;
  content?: string;
  isApproved?: boolean;
}

// ==================== MODERATION ====================

export interface ModerationQueueItem extends BaseModel {
  tenantId: string;
  contentType: 'COMMENT' | 'REVIEW' | 'PODCAST' | 'EPISODE' | 'USER';
  contentId: string;
  reportReason: string | null;
  reportedById: string | null;
  moderatorId: string | null;
  status: ModerationStatus;
  notes: string | null;
  moderatedAt: string | null;
  reportedBy?: Pick<User, 'id' | 'name'>;
  moderator?: Pick<User, 'id' | 'name'>;
  content?: Comment | Review | Podcast | Episode | User;
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  escalated: number;
  total: number;
}

export interface ModerateContentDto {
  status: ModerationStatus;
  notes?: string;
}

// ==================== NOTIFICATION ====================

export interface Notification extends BaseModel {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
}

// ==================== LIVE STREAM ====================

export interface LiveStream extends BaseModel {
  tenantId: string;
  hostId: string;
  title: string;
  description: string | null;
  streamKey: string;
  hlsUrl: string | null;
  hlsPath: string | null;
  status: LiveStreamStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  peakViewers: number;
  totalViewers: number;
  recordingUrl: string | null;
  recordingPath: string | null;
  isRecorded: boolean;
  host?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  _count?: {
    rooms: number;
    listeners: number;
  };
}

export interface LiveRoom {
  id: string;
  streamId: string;
  roomNumber: number;
  name: string;
  capacity: number;
  currentCount: number;
  isActive: boolean;
}

export interface LiveListener {
  id: string;
  streamId: string;
  roomId: string;
  userId: string | null;
  sessionId: string;
  joinedAt: string;
  leftAt: string | null;
  duration: number | null;
  deviceType: string | null;
}

export interface CreateLiveStreamDto {
  title: string;
  description?: string;
  scheduledAt?: string;
  isRecorded?: boolean;
}

export interface UpdateLiveStreamDto {
  title?: string;
  description?: string;
  scheduledAt?: string;
  status?: LiveStreamStatus;
}

// ==================== SMS ====================

export interface SmsConfig {
  id: string;
  tenantId: string;
  isEnabled: boolean;
  provider: SmsProvider;
  netgsmUsercode: string | null;
  netgsmMsgHeader: string | null;
  otpLength: number;
  otpExpiryMins: number;
  maxAttempts: number;
  resendCooldown: number;
  updatedAt: string;
}

export interface SmsLog extends BaseModel {
  tenantId: string;
  phone: string;
  type: SmsType;
  message: string;
  status: SmsStatus;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
}

// ==================== PUSH ====================

export interface PushConfig {
  id: string;
  tenantId: string;
  provider: PushProviderType;
  oneSignalAppId: string | null;
  firebaseProjectId: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PushNotificationLog extends BaseModel {
  tenantId: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  targetType: PushTargetType;
  targetIds: string[];
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  status: PushStatus;
  sentAt: string | null;
  completedAt: string | null;
}

// ==================== SOCIAL AUTH ====================

export interface SocialAuthConfig {
  id: string;
  tenantId: string;
  googleEnabled: boolean;
  appleEnabled: boolean;
  facebookEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== ANALYTICS ====================

export interface AnalyticsEvent extends BaseModel {
  tenantId: string;
  userId: string | null;
  eventType: AnalyticsEventType;
  podcastId: string | null;
  episodeId: string | null;
  sessionId: string | null;
  metadata: Record<string, unknown> | null;
  deviceType: string | null;
  platform: string | null;
  country: string | null;
  city: string | null;
}

export interface DashboardStats {
  totalUsers: number;
  totalPodcasts: number;
  totalEpisodes: number;
  totalPlays: number;
  activeUsers: number;
  newUsersToday: number;
  playsToday: number;
  userGrowth: number;
  podcastGrowth: number;
  playGrowth: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface TopPodcastStats {
  id: string;
  title: string;
  coverImageUrl: string | null;
  playCount: number;
  followerCount: number;
}

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

// ==================== AUTH ====================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PhoneLoginCredentials {
  phone: string;
  code: string;
}
