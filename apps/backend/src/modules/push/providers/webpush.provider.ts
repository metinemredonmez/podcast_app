import { Injectable, Logger } from '@nestjs/common';
import { PushProviderType } from '@prisma/client';
import * as crypto from 'crypto';
import {
  PushProvider,
  PushProviderConfig,
  PushMessage,
  SendResult,
} from './push-provider.interface';

interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface WebPushConfig extends PushProviderConfig {
  vapidPublicKey?: string;
  vapidPrivateKey?: string;
  vapidSubject?: string;
}

/**
 * Web Push Provider
 * Uses VAPID for authentication and Web Push Protocol
 * Works with Service Workers on web browsers
 */
@Injectable()
export class WebPushProvider implements PushProvider {
  private readonly logger = new Logger(WebPushProvider.name);
  readonly type = 'WEBPUSH' as PushProviderType; // Will use FIREBASE for web since enum doesn't have WEBPUSH

  private vapidPublicKey: string | null = null;
  private vapidPrivateKey: string | null = null;
  private vapidSubject: string | null = null;
  private initialized = false;

  async initialize(config: WebPushConfig): Promise<void> {
    if (!config.vapidPublicKey || !config.vapidPrivateKey || !config.vapidSubject) {
      throw new Error('Web Push requires VAPID public key, private key, and subject');
    }

    this.vapidPublicKey = config.vapidPublicKey;
    this.vapidPrivateKey = config.vapidPrivateKey;
    this.vapidSubject = config.vapidSubject;
    this.initialized = true;
    this.logger.log('Web Push provider initialized');
  }

  isReady(): boolean {
    return this.initialized && !!this.vapidPublicKey && !!this.vapidPrivateKey;
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  getVapidPublicKey(): string | null {
    return this.vapidPublicKey;
  }

  /**
   * Send push to web browser endpoints
   * Tokens should be JSON stringified WebPushSubscription objects
   */
  async sendToDevices(tokens: string[], message: PushMessage): Promise<SendResult> {
    if (!this.isReady()) {
      return { success: false, error: 'Web Push not initialized' };
    }

    const results: { success: boolean; token: string }[] = [];

    for (const token of tokens) {
      try {
        const subscription: WebPushSubscription = JSON.parse(token);
        await this.sendNotification(subscription, message);
        results.push({ success: true, token });
      } catch (error) {
        this.logger.warn(`Failed to send to endpoint: ${error}`);
        results.push({ success: false, token });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedTokens = results.filter(r => !r.success).map(r => r.token);

    return {
      success: successCount > 0,
      successCount,
      failureCount: failedTokens.length,
      failedTokens,
    };
  }

  async sendToTopic(_topic: string, _message: PushMessage): Promise<SendResult> {
    // Web Push doesn't support topics directly
    // You'd need to maintain topic subscriptions in your DB
    return {
      success: false,
      error: 'Web Push does not support topic messaging directly',
    };
  }

  private async sendNotification(
    subscription: WebPushSubscription,
    message: PushMessage,
  ): Promise<void> {
    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      icon: message.imageUrl,
      badge: message.badge,
      data: message.data || {},
    });

    const vapidHeaders = await this.getVapidHeaders(subscription.endpoint);

    const encrypted = await this.encryptPayload(
      payload,
      subscription.keys.p256dh,
      subscription.keys.auth,
    );

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Content-Length': encrypted.length.toString(),
        TTL: '86400', // 24 hours
        ...vapidHeaders,
      },
      body: encrypted,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Web Push failed: ${response.status} - ${errorText}`);
    }
  }

  private async getVapidHeaders(endpoint: string): Promise<Record<string, string>> {
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const header = {
      typ: 'JWT',
      alg: 'ES256',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: audience,
      exp: now + 12 * 60 * 60, // 12 hours
      sub: this.vapidSubject,
    };

    const jwt = await this.createVapidJwt(header, payload);

    return {
      Authorization: `vapid t=${jwt}, k=${this.vapidPublicKey}`,
    };
  }

  private async createVapidJwt(
    header: Record<string, string>,
    payload: Record<string, string | number | undefined>,
  ): Promise<string> {
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    // Convert VAPID private key from URL-safe base64 to buffer
    const privateKeyBuffer = Buffer.from(this.vapidPrivateKey!, 'base64url');

    // Create ECDSA signature
    const sign = crypto.createSign('SHA256');
    sign.update(signatureInput);

    // Import as EC key
    const keyObject = crypto.createPrivateKey({
      key: this.formatAsEcPrivateKey(privateKeyBuffer),
      format: 'pem',
    });

    const signature = sign.sign(keyObject);

    // Convert DER signature to raw format for JWT
    const rawSignature = this.derToRaw(signature);

    return `${signatureInput}.${rawSignature.toString('base64url')}`;
  }

  private formatAsEcPrivateKey(privateKey: Buffer): string {
    // This is a simplified version - in production use proper ASN.1 encoding
    const prefix = Buffer.from(
      '308141020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420',
      'hex',
    );
    const der = Buffer.concat([prefix, privateKey]);
    const b64 = der.toString('base64');
    return `-----BEGIN EC PRIVATE KEY-----\n${b64}\n-----END EC PRIVATE KEY-----`;
  }

  private derToRaw(signature: Buffer): Buffer {
    // Convert DER encoded ECDSA signature to raw R||S format
    // DER: 0x30 [length] 0x02 [r-length] [r] 0x02 [s-length] [s]
    let offset = 2;
    const rLength = signature[offset + 1];
    const r = signature.subarray(offset + 2, offset + 2 + rLength);
    offset += 2 + rLength;
    const sLength = signature[offset + 1];
    const s = signature.subarray(offset + 2, offset + 2 + sLength);

    // Pad to 32 bytes each
    const rPadded = Buffer.alloc(32);
    const sPadded = Buffer.alloc(32);
    r.copy(rPadded, 32 - r.length);
    s.copy(sPadded, 32 - s.length);

    return Buffer.concat([rPadded, sPadded]);
  }

  private async encryptPayload(
    payload: string,
    p256dh: string,
    auth: string,
  ): Promise<Buffer> {
    // This is a simplified implementation
    // In production, use the web-push npm package or implement full RFC 8291

    const userPublicKey = Buffer.from(p256dh, 'base64url');
    const userAuth = Buffer.from(auth, 'base64url');

    // Generate ephemeral key pair
    const ecdh = crypto.createECDH('prime256v1');
    const localPublicKey = ecdh.generateKeys();
    const sharedSecret = ecdh.computeSecret(userPublicKey);

    // Generate salt
    const salt = crypto.randomBytes(16);

    // Derive encryption key using HKDF
    const prk = this.hkdf(userAuth, sharedSecret, Buffer.from('Content-Encoding: auth\0'), 32);
    const context = this.createContext(userPublicKey, localPublicKey);
    const contentEncryptionKey = this.hkdf(salt, prk, this.createInfo('aesgcm', context), 16);
    const nonce = this.hkdf(salt, prk, this.createInfo('nonce', context), 12);

    // Encrypt
    const cipher = crypto.createCipheriv('aes-128-gcm', contentEncryptionKey, nonce);
    const paddedPayload = Buffer.concat([Buffer.alloc(2), Buffer.from(payload)]);

    let encrypted = cipher.update(paddedPayload);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const tag = cipher.getAuthTag();

    // Build final payload
    const recordSize = Buffer.alloc(4);
    recordSize.writeUInt32BE(4096, 0);

    return Buffer.concat([
      salt,
      recordSize,
      Buffer.from([localPublicKey.length]),
      localPublicKey,
      encrypted,
      tag,
    ]);
  }

  private hkdf(salt: Buffer, ikm: Buffer, info: Buffer, length: number): Buffer {
    const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
    const infoBuffer = Buffer.concat([info, Buffer.from([1])]);
    return crypto.createHmac('sha256', prk).update(infoBuffer).digest().subarray(0, length);
  }

  private createContext(userPublicKey: Buffer, localPublicKey: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from('P-256\0'),
      Buffer.from([0, 65]),
      userPublicKey,
      Buffer.from([0, 65]),
      localPublicKey,
    ]);
  }

  private createInfo(type: string, context: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from(`Content-Encoding: ${type}\0`),
      context,
    ]);
  }

  /**
   * Generate VAPID key pair (for initial setup)
   */
  static generateVapidKeys(): { publicKey: string; privateKey: string } {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();

    return {
      publicKey: ecdh.getPublicKey('base64url'),
      privateKey: ecdh.getPrivateKey('base64url'),
    };
  }
}
