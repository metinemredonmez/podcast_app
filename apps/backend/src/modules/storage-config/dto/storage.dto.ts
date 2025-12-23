import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';

export enum StorageProviderEnum {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  MINIO = 'MINIO',
}

// ==================== STORAGE CONFIG DTOs ====================

export class UpdateStorageConfigDto {
  @ApiPropertyOptional({ enum: StorageProviderEnum })
  @IsOptional()
  @IsEnum(StorageProviderEnum)
  provider?: StorageProviderEnum;

  // Local Storage
  @ApiPropertyOptional({ description: 'Local storage path' })
  @IsOptional()
  @IsString()
  localPath?: string;

  // AWS S3 Settings
  @ApiPropertyOptional({ description: 'S3 Bucket Name' })
  @IsOptional()
  @IsString()
  s3Bucket?: string;

  @ApiPropertyOptional({ description: 'S3 Region' })
  @IsOptional()
  @IsString()
  s3Region?: string;

  @ApiPropertyOptional({ description: 'S3 Access Key' })
  @IsOptional()
  @IsString()
  s3AccessKey?: string;

  @ApiPropertyOptional({ description: 'S3 Secret Key (will be encrypted)' })
  @IsOptional()
  @IsString()
  s3SecretKey?: string;

  @ApiPropertyOptional({ description: 'S3 Endpoint (for S3-compatible services)' })
  @IsOptional()
  @IsString()
  s3Endpoint?: string;

  // MinIO Settings
  @ApiPropertyOptional({ description: 'MinIO Endpoint' })
  @IsOptional()
  @IsString()
  minioEndpoint?: string;

  @ApiPropertyOptional({ description: 'MinIO Bucket Name' })
  @IsOptional()
  @IsString()
  minioBucket?: string;

  @ApiPropertyOptional({ description: 'MinIO Access Key' })
  @IsOptional()
  @IsString()
  minioAccessKey?: string;

  @ApiPropertyOptional({ description: 'MinIO Secret Key (will be encrypted)' })
  @IsOptional()
  @IsString()
  minioSecretKey?: string;

  @ApiPropertyOptional({ description: 'Use SSL for MinIO' })
  @IsOptional()
  @IsBoolean()
  minioUseSSL?: boolean;

  // Common Settings
  @ApiPropertyOptional({ description: 'Max file size in bytes', default: 104857600 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxFileSize?: number;

  @ApiPropertyOptional({ description: 'Allowed MIME types', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedMimeTypes?: string[];

  @ApiPropertyOptional({ description: 'Public base URL for accessing files' })
  @IsOptional()
  @IsString()
  publicBaseUrl?: string;
}

export class StorageConfigResponseDto {
  @ApiProperty({ enum: StorageProviderEnum })
  provider: StorageProviderEnum;

  // Local
  @ApiPropertyOptional()
  localPath: string | null;

  // S3
  @ApiPropertyOptional()
  s3Bucket: string | null;

  @ApiPropertyOptional()
  s3Region: string | null;

  @ApiPropertyOptional()
  s3AccessKey: string | null;

  @ApiProperty({ description: 'Whether S3 secret key is configured' })
  hasS3SecretKey: boolean;

  @ApiPropertyOptional()
  s3Endpoint: string | null;

  // MinIO
  @ApiPropertyOptional()
  minioEndpoint: string | null;

  @ApiPropertyOptional()
  minioBucket: string | null;

  @ApiPropertyOptional()
  minioAccessKey: string | null;

  @ApiProperty({ description: 'Whether MinIO secret key is configured' })
  hasMinioSecretKey: boolean;

  @ApiPropertyOptional()
  minioUseSSL: boolean;

  // Common
  @ApiPropertyOptional()
  maxFileSize: number | null;

  @ApiPropertyOptional({ type: [String] })
  allowedMimeTypes: string[];

  @ApiPropertyOptional()
  publicBaseUrl: string | null;

  @ApiPropertyOptional()
  updatedAt: Date | null;
}

export class TestStorageResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  details?: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
}

export class StorageStatsDto {
  @ApiProperty()
  provider: string;

  @ApiProperty()
  totalFiles: number;

  @ApiProperty()
  totalSize: number;

  @ApiProperty()
  totalSizeFormatted: string;
}
