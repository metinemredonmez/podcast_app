import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEpisodeDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Defaults to current tenant when omitted' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  podcastId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  hostId?: string;

  @ApiProperty({ minLength: 3, maxLength: 160 })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({
    description: 'Custom slug, auto-generated from title. Only lowercase letters, numbers, and hyphens.',
    pattern: '^[a-z0-9-]+$',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
  slug?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ minimum: 1, description: 'Duration in seconds' })
  @IsInt()
  @Min(1)
  duration!: number;

  @ApiPropertyOptional({ description: 'Audio file URL (MP3, etc.)' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  // Video support
  @ApiPropertyOptional({ description: 'Video file URL (MP4, etc.)' })
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

  @ApiPropertyOptional({ description: 'External video URL (Dailymotion, Vimeo, etc.)' })
  @IsOptional()
  @IsString()
  externalVideoUrl?: string;

  // Content metadata
  @ApiPropertyOptional({ description: 'Tags for the episode', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Video quality (HD, SD, 4K)' })
  @IsOptional()
  @IsString()
  quality?: string;

  @ApiPropertyOptional({ description: 'Episode-specific thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Publish date; defaults to now if published' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Mark as featured episode' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Episode number within the podcast' })
  @IsOptional()
  @IsInt()
  @Min(1)
  episodeNumber?: number;

  @ApiPropertyOptional({ description: 'Season number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  seasonNumber?: number;
}
