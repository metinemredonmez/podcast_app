import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class S3Service {
  private readonly client: Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('storage.endpoint', 'http://localhost:9000');
    const accessKey = config.get<string>('storage.accessKey', 'local');
    const secretKey = config.get<string>('storage.secretKey', 'local');
    this.bucket = config.get<string>('storage.bucket', 'podcast-app');

    const endpointUrl = new URL(endpoint);
    const inferredPort =
      endpointUrl.port !== ''
        ? Number(endpointUrl.port)
        : endpointUrl.protocol === 'https:'
        ? 443
        : 80;

    this.client = new Client({
      endPoint: endpointUrl.hostname,
      port: inferredPort,
      useSSL: endpointUrl.protocol === 'https:',
      accessKey,
      secretKey,
    });
  }

  getClient(): Client {
    return this.client;
  }

  getBucket(): string {
    return this.bucket;
  }

  async putObject(
    key: string,
    body: Buffer | NodeJS.ReadableStream,
    contentType?: string,
    metadata: Record<string, string> = {},
  ): Promise<string> {
    const meta: Record<string, string> = {
      ...(contentType ? { 'Content-Type': contentType } : {}),
      ...metadata,
    };

    if (Buffer.isBuffer(body)) {
      return this.client.putObject(this.bucket, key, body, body.length, meta);
    }

    return this.client.putObject(this.bucket, key, body, undefined, meta);
  }

  async getSignedUrl(key: string, expiresInSeconds = 604800): Promise<string> {
    // Default: 7 days (604800 seconds) - maximum allowed by S3
    return this.client.presignedGetObject(this.bucket, key, expiresInSeconds);
  }

  /**
   * Get public URL for a file (no expiration, requires public bucket policy)
   */
  getPublicUrl(key: string): string {
    const endpoint = this.config.get<string>('storage.endpoint', 'http://localhost:9000');
    return `${endpoint}/${this.bucket}/${key}`;
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
