import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * AES-256-GCM Encryption Service
 * Used to encrypt sensitive data like API keys before storing in DB
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');

    if (!key) {
      this.logger.warn('ENCRYPTION_KEY not set, generating random key (not persistent!)');
      this.encryptionKey = crypto.randomBytes(this.keyLength);
    } else {
      // Key should be base64 encoded 32-byte value
      this.encryptionKey = Buffer.from(key, 'base64');

      if (this.encryptionKey.length !== this.keyLength) {
        throw new Error(
          `ENCRYPTION_KEY must be exactly ${this.keyLength} bytes (256 bits) when decoded. ` +
          `Got ${this.encryptionKey.length} bytes. ` +
          `Generate with: openssl rand -base64 32`
        );
      }
    }
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   * Returns base64 encoded string: iv:ciphertext:tag
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const tag = cipher.getAuthTag();

      // Format: iv:ciphertext:tag (all base64)
      return `${iv.toString('base64')}:${encrypted.toString('base64')}:${tag.toString('base64')}`;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   * Expects base64 encoded string: iv:ciphertext:tag
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      return '';
    }

    try {
      const parts = ciphertext.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
      }

      const iv = Buffer.from(parts[0], 'base64');
      const encrypted = Buffer.from(parts[1], 'base64');
      const tag = Buffer.from(parts[2], 'base64');

      if (iv.length !== this.ivLength) {
        throw new Error('Invalid IV length');
      }

      if (tag.length !== this.tagLength) {
        throw new Error('Invalid auth tag length');
      }

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if a string is encrypted (has the iv:ciphertext:tag format)
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;
    const parts = value.split(':');
    return parts.length === 3 && parts.every(part => {
      try {
        return Buffer.from(part, 'base64').length > 0;
      } catch {
        return false;
      }
    });
  }

  /**
   * Generate a new encryption key (for setup)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Hash a value using SHA-256 (for non-reversible hashing)
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
