import { Injectable, Logger } from '@nestjs/common';
import { PushProviderType } from '@prisma/client';
import {
  PushProvider,
  PushProviderConfig,
  PushMessage,
  SendResult,
} from './push-provider.interface';

interface OneSignalNotificationResponse {
  id?: string;
  recipients?: number;
  errors?: string[];
}

/**
 * OneSignal Push Provider
 * Uses OneSignal REST API for push notifications
 */
@Injectable()
export class OneSignalProvider implements PushProvider {
  private readonly logger = new Logger(OneSignalProvider.name);
  readonly type = PushProviderType.ONESIGNAL;

  private appId: string | null = null;
  private apiKey: string | null = null;
  private initialized = false;

  async initialize(config: PushProviderConfig): Promise<void> {
    if (!config.appId || !config.apiKey) {
      throw new Error('OneSignal requires appId and apiKey');
    }

    this.appId = config.appId;
    this.apiKey = config.apiKey;
    this.initialized = true;
    this.logger.log('OneSignal provider initialized');
  }

  isReady(): boolean {
    return this.initialized && !!this.appId && !!this.apiKey;
  }

  async sendToDevices(tokens: string[], message: PushMessage): Promise<SendResult> {
    if (!this.isReady()) {
      return { success: false, error: 'OneSignal not initialized' };
    }

    try {
      const payload = {
        app_id: this.appId,
        include_player_ids: tokens,
        headings: { en: message.title },
        contents: { en: message.body },
        data: message.data || {},
        ...(message.imageUrl && { big_picture: message.imageUrl }),
        ...(message.sound && { ios_sound: message.sound, android_sound: message.sound }),
        ...(message.badge !== undefined && { ios_badgeType: 'SetTo', ios_badgeCount: message.badge }),
        ...(message.channelId && { android_channel_id: message.channelId }),
        ...(message.category && { ios_category: message.category }),
      };

      const response = await this.makeRequest<OneSignalNotificationResponse>('POST', '/notifications', payload);

      if (response.errors && response.errors.length > 0) {
        this.logger.warn(`OneSignal errors: ${response.errors.join(', ')}`);
      }

      return {
        success: true,
        messageId: response.id,
        successCount: response.recipients || 0,
        failureCount: tokens.length - (response.recipients || 0),
      };
    } catch (error) {
      this.logger.error('OneSignal sendToDevices failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendToTopic(topic: string, message: PushMessage): Promise<SendResult> {
    if (!this.isReady()) {
      return { success: false, error: 'OneSignal not initialized' };
    }

    try {
      // OneSignal uses "segments" instead of topics
      const payload = {
        app_id: this.appId,
        included_segments: [topic],
        headings: { en: message.title },
        contents: { en: message.body },
        data: message.data || {},
        ...(message.imageUrl && { big_picture: message.imageUrl }),
        ...(message.sound && { ios_sound: message.sound, android_sound: message.sound }),
        ...(message.badge !== undefined && { ios_badgeType: 'SetTo', ios_badgeCount: message.badge }),
      };

      const response = await this.makeRequest<OneSignalNotificationResponse>('POST', '/notifications', payload);

      return {
        success: true,
        messageId: response.id,
        successCount: response.recipients || 0,
      };
    } catch (error) {
      this.logger.error('OneSignal sendToTopic failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('OneSignal not initialized');
    }

    // OneSignal handles segments differently - tags are used
    // This would typically update user tags
    this.logger.log(`Would subscribe ${tokens.length} devices to segment: ${topic}`);
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('OneSignal not initialized');
    }

    this.logger.log(`Would unsubscribe ${tokens.length} devices from segment: ${topic}`);
  }

  private async makeRequest<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
    const url = `https://onesignal.com/api/v1${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OneSignal API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }
}
