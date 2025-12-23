import { PushProviderType } from '@prisma/client';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
  channelId?: string; // Android
  category?: string; // iOS
}

export interface PushTarget {
  deviceTokens?: string[];
  userIds?: string[];
  topic?: string;
  segment?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  successCount?: number;
  failureCount?: number;
  failedTokens?: string[];
  error?: string;
}

export interface PushProviderConfig {
  appId?: string;
  apiKey?: string;
  projectId?: string;
  credentials?: string; // JSON string for Firebase service account
}

export interface PushProvider {
  readonly type: PushProviderType;

  /**
   * Initialize the provider with config
   */
  initialize(config: PushProviderConfig): Promise<void>;

  /**
   * Check if provider is initialized and ready
   */
  isReady(): boolean;

  /**
   * Send push notification to specific device tokens
   */
  sendToDevices(tokens: string[], message: PushMessage): Promise<SendResult>;

  /**
   * Send push notification to a topic/segment
   */
  sendToTopic(topic: string, message: PushMessage): Promise<SendResult>;

  /**
   * Subscribe devices to a topic
   */
  subscribeToTopic?(tokens: string[], topic: string): Promise<void>;

  /**
   * Unsubscribe devices from a topic
   */
  unsubscribeFromTopic?(tokens: string[], topic: string): Promise<void>;

  /**
   * Validate device token
   */
  validateToken?(token: string): Promise<boolean>;
}
