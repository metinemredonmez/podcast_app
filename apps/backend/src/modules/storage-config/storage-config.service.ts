import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { EncryptionService } from '../../common/encryption';
import {
  UpdateStorageConfigDto,
  StorageConfigResponseDto,
  TestStorageResponseDto,
  StorageStatsDto,
  StorageProviderEnum,
} from './dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageConfigService {
  private readonly logger = new Logger(StorageConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  /**
   * Get Storage configuration (for admin - with masked secrets)
   */
  async getConfig(tenantId?: string): Promise<StorageConfigResponseDto> {
    const config = await this.prisma.storageConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (!config) {
      return {
        provider: StorageProviderEnum.LOCAL,
        localPath: './uploads',
        s3Bucket: null,
        s3Region: null,
        s3AccessKey: null,
        hasS3SecretKey: false,
        s3Endpoint: null,
        minioEndpoint: null,
        minioBucket: null,
        minioAccessKey: null,
        hasMinioSecretKey: false,
        minioUseSSL: false,
        maxFileSize: 104857600,
        allowedMimeTypes: ['image/*', 'audio/*', 'video/*'],
        publicBaseUrl: null,
        updatedAt: null,
      };
    }

    return {
      provider: config.provider as StorageProviderEnum,
      localPath: config.localPath,
      s3Bucket: config.s3Bucket,
      s3Region: config.s3Region,
      s3AccessKey: config.s3AccessKey,
      hasS3SecretKey: !!config.s3SecretKey,
      s3Endpoint: config.s3Endpoint,
      minioEndpoint: config.minioEndpoint,
      minioBucket: config.minioBucket,
      minioAccessKey: config.minioAccessKey,
      hasMinioSecretKey: !!config.minioSecretKey,
      minioUseSSL: config.minioUseSSL,
      maxFileSize: config.maxFileSize ? Number(config.maxFileSize) : 104857600,
      allowedMimeTypes: config.allowedMimeTypes,
      publicBaseUrl: config.publicBaseUrl,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update Storage configuration
   */
  async updateConfig(
    dto: UpdateStorageConfigDto,
    tenantId?: string,
  ): Promise<StorageConfigResponseDto> {
    const data: Record<string, unknown> = {};

    if (dto.provider !== undefined) {
      data.provider = dto.provider;
    }

    // Local storage
    if (dto.localPath !== undefined) {
      data.localPath = dto.localPath || null;
    }

    // S3 fields
    if (dto.s3Bucket !== undefined) {
      data.s3Bucket = dto.s3Bucket || null;
    }
    if (dto.s3Region !== undefined) {
      data.s3Region = dto.s3Region || null;
    }
    if (dto.s3AccessKey !== undefined) {
      data.s3AccessKey = dto.s3AccessKey || null;
    }
    if (dto.s3SecretKey) {
      data.s3SecretKey = this.encryption.encrypt(dto.s3SecretKey);
    }
    if (dto.s3Endpoint !== undefined) {
      data.s3Endpoint = dto.s3Endpoint || null;
    }

    // MinIO fields
    if (dto.minioEndpoint !== undefined) {
      data.minioEndpoint = dto.minioEndpoint || null;
    }
    if (dto.minioBucket !== undefined) {
      data.minioBucket = dto.minioBucket || null;
    }
    if (dto.minioAccessKey !== undefined) {
      data.minioAccessKey = dto.minioAccessKey || null;
    }
    if (dto.minioSecretKey) {
      data.minioSecretKey = this.encryption.encrypt(dto.minioSecretKey);
    }
    if (dto.minioUseSSL !== undefined) {
      data.minioUseSSL = dto.minioUseSSL;
    }

    // Common fields
    if (dto.maxFileSize !== undefined) {
      data.maxFileSize = BigInt(dto.maxFileSize);
    }
    if (dto.allowedMimeTypes !== undefined) {
      data.allowedMimeTypes = dto.allowedMimeTypes;
    }
    if (dto.publicBaseUrl !== undefined) {
      data.publicBaseUrl = dto.publicBaseUrl || null;
    }

    const existingConfig = await this.prisma.storageConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (existingConfig) {
      await this.prisma.storageConfig.update({
        where: { id: existingConfig.id },
        data,
      });
    } else {
      await this.prisma.storageConfig.create({
        data: {
          tenantId: tenantId || null,
          ...data,
        } as Parameters<typeof this.prisma.storageConfig.create>[0]['data'],
      });
    }

    return this.getConfig(tenantId);
  }

  /**
   * Delete Storage credentials
   */
  async deleteCredentials(tenantId?: string): Promise<void> {
    const config = await this.prisma.storageConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (config) {
      await this.prisma.storageConfig.update({
        where: { id: config.id },
        data: {
          provider: 'LOCAL',
          s3Bucket: null,
          s3Region: null,
          s3AccessKey: null,
          s3SecretKey: null,
          s3Endpoint: null,
          minioEndpoint: null,
          minioBucket: null,
          minioAccessKey: null,
          minioSecretKey: null,
        },
      });
    }
  }

  /**
   * Test Storage connection
   */
  async testConnection(tenantId?: string): Promise<TestStorageResponseDto> {
    const config = await this.prisma.storageConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (!config) {
      return {
        success: false,
        message: 'Storage yapılandırılmamış',
      };
    }

    switch (config.provider) {
      case 'LOCAL':
        return this.testLocalStorage(config.localPath || './uploads');
      case 'S3':
        return this.testS3Storage(config);
      case 'MINIO':
        return this.testMinioStorage(config);
      default:
        return {
          success: false,
          message: 'Bilinmeyen storage provider',
        };
    }
  }

  private async testLocalStorage(localPath: string): Promise<TestStorageResponseDto> {
    try {
      const absolutePath = path.isAbsolute(localPath)
        ? localPath
        : path.join(process.cwd(), localPath);

      // Check if directory exists, create if not
      if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true });
      }

      // Test write
      const testFile = path.join(absolutePath, '.storage-test');
      fs.writeFileSync(testFile, 'test');
      const canWrite = fs.existsSync(testFile);

      // Test read
      const content = fs.readFileSync(testFile, 'utf-8');
      const canRead = content === 'test';

      // Test delete
      fs.unlinkSync(testFile);
      const canDelete = !fs.existsSync(testFile);

      return {
        success: canWrite && canRead && canDelete,
        message: 'Local storage bağlantısı başarılı',
        details: {
          canRead,
          canWrite,
          canDelete,
        },
      };
    } catch (error) {
      this.logger.error('Local storage test failed', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Local storage hatası',
      };
    }
  }

  private async testS3Storage(config: {
    s3Bucket: string | null;
    s3Region: string | null;
    s3AccessKey: string | null;
    s3SecretKey: string | null;
  }): Promise<TestStorageResponseDto> {
    if (!config.s3Bucket || !config.s3Region || !config.s3AccessKey || !config.s3SecretKey) {
      return {
        success: false,
        message: 'S3 yapılandırması eksik',
      };
    }

    // Just verify credentials exist for now
    // Full S3 testing would require aws-sdk
    return {
      success: true,
      message: 'S3 kimlik bilgileri yapılandırılmış. Tam test için aws-sdk gerekli.',
    };
  }

  private async testMinioStorage(config: {
    minioEndpoint: string | null;
    minioBucket: string | null;
    minioAccessKey: string | null;
    minioSecretKey: string | null;
  }): Promise<TestStorageResponseDto> {
    if (!config.minioEndpoint || !config.minioBucket || !config.minioAccessKey || !config.minioSecretKey) {
      return {
        success: false,
        message: 'MinIO yapılandırması eksik',
      };
    }

    // Just verify credentials exist for now
    // Full MinIO testing would require minio-js
    return {
      success: true,
      message: 'MinIO kimlik bilgileri yapılandırılmış. Tam test için minio paketi gerekli.',
    };
  }

  /**
   * Get Storage statistics
   */
  async getStats(tenantId?: string): Promise<StorageStatsDto> {
    const config = await this.prisma.storageConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    const provider = config?.provider || 'LOCAL';

    // For local storage, we can calculate actual stats
    if (provider === 'LOCAL') {
      const localPath = config?.localPath || './uploads';
      const stats = this.getLocalStorageStats(localPath);
      return {
        provider,
        ...stats,
      };
    }

    // For cloud storage, return placeholder stats
    return {
      provider,
      totalFiles: 0,
      totalSize: 0,
      totalSizeFormatted: '0 B',
    };
  }

  private getLocalStorageStats(localPath: string): { totalFiles: number; totalSize: number; totalSizeFormatted: string } {
    try {
      const absolutePath = path.isAbsolute(localPath)
        ? localPath
        : path.join(process.cwd(), localPath);

      if (!fs.existsSync(absolutePath)) {
        return { totalFiles: 0, totalSize: 0, totalSizeFormatted: '0 B' };
      }

      let totalFiles = 0;
      let totalSize = 0;

      const walkDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            walkDir(filePath);
          } else {
            totalFiles++;
            totalSize += stat.size;
          }
        }
      };

      walkDir(absolutePath);

      return {
        totalFiles,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
      };
    } catch {
      return { totalFiles: 0, totalSize: 0, totalSizeFormatted: '0 B' };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
