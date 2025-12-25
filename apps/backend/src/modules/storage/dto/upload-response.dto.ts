import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class UploadResponseDto {
  @ApiProperty({ description: 'Object storage key', example: 'tenant-123/covers/uuid-file.png' })
  @IsString()
  readonly key!: string;

  @ApiProperty({ description: 'Public download URL (no expiration)' })
  @IsString()
  @IsUrl()
  readonly url!: string;

  @ApiProperty({ description: 'Name of the target bucket', example: 'podcast-app' })
  @IsString()
  readonly bucket!: string;

  @ApiPropertyOptional({ description: 'Size of the uploaded object in bytes', example: 1048576 })
  @IsOptional()
  @IsNumber()
  readonly sizeBytes?: number;

  @ApiPropertyOptional({ description: 'Detected MIME type for the uploaded object', example: 'image/png' })
  @IsOptional()
  @IsString()
  readonly mimeType?: string;
}
