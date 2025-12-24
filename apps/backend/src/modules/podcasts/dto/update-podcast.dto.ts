import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MediaType, MediaQuality } from '../../../common/enums/prisma.enums';

export class UpdatePodcastDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Publish time (ISO8601)' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ type: [String], description: 'Category IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Media type for the podcast', enum: MediaType })
  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @ApiPropertyOptional({ description: 'Default quality for episodes', enum: MediaQuality })
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
}
