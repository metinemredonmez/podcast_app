import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MediaType, MediaQuality } from '../../../common/enums/prisma.enums';

export class CreatePodcastDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Defaults to current tenant when omitted' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Owner ID - defaults to current user when omitted' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiProperty({ minLength: 3, maxLength: 120 })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({
    description: 'Custom slug, auto-generated if omitted. Only lowercase letters, numbers, and hyphens.',
    pattern: '^[a-z0-9-]+$',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
  slug?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Absolute cover image URL' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Single category ID (convenience field - will be converted to categoryIds array)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Category IDs associated to the podcast', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Media type for the podcast', enum: MediaType, default: MediaType.AUDIO })
  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @ApiPropertyOptional({ description: 'Default quality for episodes', enum: MediaQuality, default: MediaQuality.HD })
  @IsOptional()
  @IsEnum(MediaQuality)
  defaultQuality?: MediaQuality;

  // Media fields
  @ApiPropertyOptional({ description: 'Promo audio URL' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Audio MIME type' })
  @IsOptional()
  @IsString()
  audioMimeType?: string;

  @ApiPropertyOptional({ description: 'Promo video URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Video MIME type' })
  @IsOptional()
  @IsString()
  videoMimeType?: string;

  @ApiPropertyOptional({ description: 'YouTube video URL' })
  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @ApiPropertyOptional({ description: 'External video URL' })
  @IsOptional()
  @IsString()
  externalVideoUrl?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  // Metadata
  @ApiPropertyOptional({ description: 'Tags for the podcast', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Featured podcast' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Publish immediately' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Explicit publish time (ISO8601)' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
