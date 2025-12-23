import { Injectable, Logger } from '@nestjs/common';
import { PushProviderType } from '@prisma/client';
import {
  PushProvider,
  PushProviderConfig,
  PushMessage,
  SendResult,
} from './push-provider.interface';

interface FirebaseServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface FirebaseTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface FirebaseSendResponse {
  name?: string;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

interface FirebaseBatchResponse {
  responses: Array<{ success: boolean; messageId?: string; error?: { code: string; message: string } }>;
  successCount: number;
  failureCount: number;
}

/**
 * Firebase Cloud Messaging (FCM) Push Provider
 * Uses FCM HTTP v1 API
 */
@Injectable()
export class FirebaseProvider implements PushProvider {
  private readonly logger = new Logger(FirebaseProvider.name);
  readonly type = PushProviderType.FIREBASE;

  private projectId: string | null = null;
  private serviceAccount: FirebaseServiceAccount | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private initialized = false;

  async initialize(config: PushProviderConfig): Promise<void> {
    if (!config.projectId || !config.credentials) {
      throw new Error('Firebase requires projectId and credentials (service account JSON)');
    }

    try {
      this.serviceAccount = JSON.parse(config.credentials) as FirebaseServiceAccount;
      this.projectId = config.projectId;

      // Get initial access token
      await this.refreshAccessToken();

      this.initialized = true;
      this.logger.log('Firebase provider initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase provider', error);
      throw new Error('Invalid Firebase credentials');
    }
  }

  isReady(): boolean {
    return this.initialized && !!this.projectId && !!this.serviceAccount;
  }

  async sendToDevices(tokens: string[], message: PushMessage): Promise<SendResult> {
    if (!this.isReady()) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      await this.ensureValidToken();

      // FCM v1 API requires sending to each token individually or using batch
      // For simplicity, we'll batch them
      const results: Array<{ success: boolean; messageId?: string; token: string }> = [];

      // Send in batches of 500 (FCM limit)
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const batchResults = await this.sendBatch(batch, message);
        results.push(...batchResults);
      }

      const successCount = results.filter(r => r.success).length;
      const failedTokens = results.filter(r => !r.success).map(r => r.token);

      return {
        success: successCount > 0,
        successCount,
        failureCount: failedTokens.length,
        failedTokens,
      };
    } catch (error) {
      this.logger.error('Firebase sendToDevices failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendToTopic(topic: string, message: PushMessage): Promise<SendResult> {
    if (!this.isReady()) {
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      await this.ensureValidToken();

      const payload = this.buildFcmPayload(message, { topic: `/topics/${topic}` });
      const response = await this.sendSingleMessage(payload);

      return {
        success: true,
        messageId: response.name,
      };
    } catch (error) {
      this.logger.error('Firebase sendToTopic failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Firebase not initialized');
    }

    await this.ensureValidToken();

    const url = `https://iid.googleapis.com/iid/v1:batchAdd`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        to: `/topics/${topic}`,
        registration_tokens: tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to subscribe to topic: ${errorText}`);
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Firebase not initialized');
    }

    await this.ensureValidToken();

    const url = `https://iid.googleapis.com/iid/v1:batchRemove`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        to: `/topics/${topic}`,
        registration_tokens: tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to unsubscribe from topic: ${errorText}`);
    }
  }

  private async sendBatch(
    tokens: string[],
    message: PushMessage,
  ): Promise<Array<{ success: boolean; messageId?: string; token: string }>> {
    const results: Array<{ success: boolean; messageId?: string; token: string }> = [];

    // Send each message individually (FCM v1 doesn't have true batch)
    const promises = tokens.map(async (token) => {
      try {
        const payload = this.buildFcmPayload(message, { token });
        const response = await this.sendSingleMessage(payload);
        return { success: true, messageId: response.name, token };
      } catch {
        return { success: false, token };
      }
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    return results;
  }

  private buildFcmPayload(
    message: PushMessage,
    target: { token?: string; topic?: string },
  ): Record<string, unknown> {
    return {
      message: {
        ...(target.token && { token: target.token }),
        ...(target.topic && { topic: target.topic }),
        notification: {
          title: message.title,
          body: message.body,
          ...(message.imageUrl && { image: message.imageUrl }),
        },
        data: message.data || {},
        android: {
          priority: 'high',
          notification: {
            ...(message.channelId && { channelId: message.channelId }),
            ...(message.sound && { sound: message.sound }),
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: message.title,
                body: message.body,
              },
              ...(message.badge !== undefined && { badge: message.badge }),
              ...(message.sound && { sound: message.sound }),
              ...(message.category && { category: message.category }),
            },
          },
        },
      },
    };
  }

  private async sendSingleMessage(payload: Record<string, unknown>): Promise<FirebaseSendResponse> {
    const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as FirebaseSendResponse;

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'FCM send failed');
    }

    return data;
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.serviceAccount) {
      throw new Error('Service account not configured');
    }

    // Create JWT for service account authentication
    const jwt = await this.createServiceAccountJwt();

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const data = await response.json() as FirebaseTokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000); // 1 min buffer
  }

  private async createServiceAccountJwt(): Promise<string> {
    if (!this.serviceAccount) {
      throw new Error('Service account not configured');
    }

    const crypto = await import('crypto');

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.serviceAccount.client_email,
      sub: this.serviceAccount.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(this.serviceAccount.private_key, 'base64url');

    return `${signatureInput}.${signature}`;
  }
}
