import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateEpisodeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'Audio file URL (MP3, etc.)' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Audio MIME type' })
  @IsOptional()
  @IsString()
  audioMimeType?: string;

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

  @ApiPropertyOptional({ description: 'Publish date override' })
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
