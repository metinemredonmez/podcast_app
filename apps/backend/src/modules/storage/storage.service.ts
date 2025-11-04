import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { S3Service } from '../../infra/s3/s3.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { SignedUrlResponseDto } from './dto/signed-url-response.dto';
import { DeleteObjectResponseDto } from './dto/delete-object-response.dto';
import { UserRole } from '../../common/enums/prisma.enums';

interface StorageActorContext {
  tenantId: string;
  userId: string;
  role: UserRole;
}

interface UploadOptions {
  prefix?: string;
  expiresIn?: number;
}

@Injectable()
export class StorageService {
  constructor(private readonly s3: S3Service) {}

  async uploadFile(
    file: Express.Multer.File | undefined,
    actor: StorageActorContext,
    options: UploadOptions = {},
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required for upload.');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty.');
    }

    const expiresIn = this.resolveExpiry(options.expiresIn);

    const normalizedPrefix = this.normalizePrefix(options.prefix);
    const key = this.buildObjectKey(actor, normalizedPrefix, file.originalname);
    const contentType = file.mimetype || 'application/octet-stream';

    await this.s3.putObject(key, file.buffer, contentType, {
      'x-amz-meta-original-name': file.originalname ?? 'unknown',
      'x-amz-meta-uploader-id': actor.userId,
    });

    const url = await this.s3.getSignedUrl(key, expiresIn);
    const sizeBytes =
      typeof file.size === 'number'
        ? file.size
        : file.buffer
        ? file.buffer.length
        : undefined;

    return {
      key,
      url,
      bucket: this.s3.getBucket(),
      expiresIn,
      sizeBytes,
      mimeType: contentType,
    };
  }

  async getSignedUrl(
    key: string,
    actor: StorageActorContext,
    expiresIn?: number,
  ): Promise<SignedUrlResponseDto> {
    this.ensureKeyAccess(key, actor);
    const resolvedExpiry = this.resolveExpiry(expiresIn);
    const signedUrl = await this.s3.getSignedUrl(key, resolvedExpiry);
    const expiresAt = new Date(Date.now() + resolvedExpiry * 1000).toISOString();
    return { key, signedUrl, expiresAt, expiresIn: resolvedExpiry };
  }

  async deleteObject(key: string, actor: StorageActorContext): Promise<DeleteObjectResponseDto> {
    this.ensureKeyAccess(key, actor);
    await this.s3.deleteObject(key);
    return { deleted: true, key };
  }

  private normalizePrefix(prefix?: string): string | undefined {
    if (!prefix) {
      return undefined;
    }

    const sanitized = prefix
      .replace(/\\/g, '/')
      .split('/')
      .filter((segment) => segment && segment !== '.' && segment !== '..')
      .join('/');

    return sanitized.length ? sanitized : undefined;
  }

  private buildObjectKey(actor: StorageActorContext, prefix: string | undefined, originalName?: string): string {
    const extension = originalName ? extname(originalName).toLowerCase() : '';
    const baseName = originalName ? originalName.replace(extension, '') : 'file';
    const safeBase = baseName
      .replace(/[^a-zA-Z0-9\-\s_]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    const normalizedBase = safeBase.length ? safeBase : 'file';
    const uniqueId = `${Date.now()}-${randomUUID()}`;
    const fileName = `${uniqueId}-${normalizedBase}${extension}`;
    const segments = [actor.tenantId, prefix, fileName].filter(Boolean) as string[];
    return segments.join('/');
  }

  private ensureKeyAccess(key: string, actor: StorageActorContext): void {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    const tenantPrefix = `${actor.tenantId}/`;
    if (!key.startsWith(tenantPrefix)) {
      throw new ForbiddenException('You do not have access to this object.');
    }
  }

  private resolveExpiry(expiresIn?: number): number {
    if (expiresIn === undefined) {
      return 3600;
    }

    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new BadRequestException('expiresIn must be a positive number.');
    }

    return Math.min(Math.floor(expiresIn), 60 * 60 * 24 * 7); // clamp to 7 days
  }
}
