import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { MediaType, MediaQuality } from '../../../common/enums/prisma.enums';

export class PodcastResponseDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty()
  @IsUUID()
  ownerId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  description!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  coverImageUrl!: string | null;

  @ApiProperty()
  @IsBoolean()
  isPublished!: boolean;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt!: Date | null;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;

  // Media type and quality
  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  mediaType!: MediaType;

  @ApiProperty({ enum: MediaQuality })
  @IsEnum(MediaQuality)
  defaultQuality!: MediaQuality;

  // Media fields
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  audioUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  audioMimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  videoUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  videoMimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  youtubeUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  externalVideoUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  thumbnailUrl!: string | null;

  @ApiProperty()
  @IsNumber()
  duration!: number;

  // Metadata
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @ApiProperty()
  @IsBoolean()
  isFeatured!: boolean;

  // Relations for list view
  @ApiPropertyOptional({ description: 'Owner information' })
  @IsOptional()
  owner?: { id: string; name: string | null };

  @ApiPropertyOptional({ description: 'Categories', type: 'array' })
  @IsOptional()
  @IsArray()
  categories?: Array<{ id: string; name: string; slug: string }>;

  @ApiPropertyOptional({ description: 'Episode count' })
  @IsOptional()
  _count?: { episodes: number };
}
