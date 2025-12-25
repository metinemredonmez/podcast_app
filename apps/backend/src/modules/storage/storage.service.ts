import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Readable } from 'stream';
import { S3Service } from '../../infra/s3/s3.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { SignedUrlResponseDto } from './dto/signed-url-response.dto';
import { DeleteObjectResponseDto } from './dto/delete-object-response.dto';
import { UserRole } from '../../common/enums/prisma.enums';
import { FileValidator } from './validators/file.validator';
import { FileCategory } from './constants/file-types';

interface StorageActorContext {
  tenantId: string;
  userId: string;
  role: UserRole;
}

interface UploadOptions {
  prefix?: string;
  expiresIn?: number;
  expectedFileType?: FileCategory; // Optional: validate against specific file type
  skipValidation?: boolean; // For legacy/special cases
}

// Large file threshold: 10MB - use streaming for files larger than this
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

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

    // Validate file unless explicitly skipped
    if (!options.skipValidation) {
      this.logger.log(`Validating file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);

      const fileCategory = FileValidator.validateOrThrow(file, options.expectedFileType);

      this.logger.log(`File validation passed: ${file.originalname} is a valid ${fileCategory} file`);
    }

    const expiresIn = this.resolveExpiry(options.expiresIn);

    const normalizedPrefix = this.normalizePrefix(options.prefix);
    const key = this.buildObjectKey(actor, normalizedPrefix, file.originalname);
    const contentType = file.mimetype || 'application/octet-stream';

    // Use streaming for large files to prevent memory spikes
    const isLargeFile = file.size > LARGE_FILE_THRESHOLD;

    if (isLargeFile) {
      this.logger.log(`Using stream upload for large file: ${file.originalname} (${file.size} bytes)`);
      // Convert buffer to stream for memory efficiency
      const stream = Readable.from(file.buffer);
      await this.s3.putObject(key, stream, contentType, {
        'x-amz-meta-original-name': file.originalname ?? 'unknown',
        'x-amz-meta-uploader-id': actor.userId,
      });
    } else {
      await this.s3.putObject(key, file.buffer, contentType, {
        'x-amz-meta-original-name': file.originalname ?? 'unknown',
        'x-amz-meta-uploader-id': actor.userId,
      });
    }

    // Public URL döndür (süre sınırı yok)
    const url = this.s3.getPublicUrl(key);
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

  /**
   * Stream-based upload for large files
   * Use this for files that come as streams (e.g., from external sources)
   */
  async uploadStream(
    stream: NodeJS.ReadableStream,
    originalName: string,
    contentType: string,
    actor: StorageActorContext,
    options: UploadOptions = {},
  ): Promise<UploadResponseDto> {
    const expiresIn = this.resolveExpiry(options.expiresIn);
    const normalizedPrefix = this.normalizePrefix(options.prefix);
    const key = this.buildObjectKey(actor, normalizedPrefix, originalName);

    this.logger.log(`Stream upload started: ${originalName}`);

    await this.s3.putObject(key, stream, contentType, {
      'x-amz-meta-original-name': originalName,
      'x-amz-meta-uploader-id': actor.userId,
    });

    // Public URL döndür (süre sınırı yok)
    const url = this.s3.getPublicUrl(key);

    this.logger.log(`Stream upload completed: ${originalName}`);

    return {
      key,
      url,
      bucket: this.s3.getBucket(),
      mimeType: contentType,
    };
  }

  /**
   * Get a presigned URL for direct client uploads
   * This allows large files to be uploaded directly to S3 without going through the server
   */
  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    actor: StorageActorContext,
    options: UploadOptions = {},
  ): Promise<{ uploadUrl: string; key: string; expiresIn: number }> {
    const normalizedPrefix = this.normalizePrefix(options.prefix);
    const key = this.buildObjectKey(actor, normalizedPrefix, filename);
    const expiresIn = this.resolveExpiry(options.expiresIn);

    // Get presigned PUT URL from MinIO/S3
    const s3Client = this.s3.getClient();
    const uploadUrl = await s3Client.presignedPutObject(this.s3.getBucket(), key, expiresIn);

    this.logger.log(`Generated presigned upload URL for: ${filename}`);

    return {
      uploadUrl,
      key,
      expiresIn,
    };
  }
}
