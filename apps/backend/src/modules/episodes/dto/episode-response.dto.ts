import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class EpisodeResponseDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty()
  @IsUUID()
  podcastId!: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsUUID()
  hostId!: string | null;

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

  @ApiProperty()
  @IsNumber()
  duration!: number;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  audioUrl!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  audioMimeType!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  videoUrl!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  videoMimeType!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  youtubeUrl!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  externalVideoUrl!: string | null;

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  quality!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  thumbnailUrl!: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  podcast?: {
    id: string;
    title: string;
    coverImageUrl?: string | null;
    mediaType?: string | null;
  };

  @ApiProperty({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt!: Date | null;

  @ApiProperty()
  @IsBoolean()
  isPublished!: boolean;

  @ApiProperty()
  @IsBoolean()
  isExplicit!: boolean;

  @ApiProperty()
  @IsBoolean()
  isFeatured!: boolean;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsNumber()
  episodeNumber!: number | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsNumber()
  seasonNumber!: number | null;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;
}
