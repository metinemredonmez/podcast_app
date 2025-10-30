import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateEpisodeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  podcastId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  hostId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ description: 'Custom slug, auto-generated from title' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
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

  @ApiProperty()
  @IsString()
  audioUrl!: string;

  @ApiPropertyOptional({ description: 'Publish date; defaults to now if published' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Episode number within the podcast' })
  @IsOptional()
  @IsInt()
  @Min(1)
  episodeNumber?: number;
}
