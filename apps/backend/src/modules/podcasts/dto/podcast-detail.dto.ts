import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { MediaType, MediaQuality } from '../../../common/enums/prisma.enums';

class PodcastEpisodeSummaryDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiProperty()
  @IsNumber()
  duration!: number;

  @ApiProperty()
  @IsBoolean()
  isPublished!: boolean;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt!: Date | null;
}

class PodcastOwnerDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsString()
  email!: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  name!: string | null;
}

class PodcastCategorySummaryDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  slug!: string;
}

export class PodcastDetailDto {
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

  @ApiProperty({ type: PodcastOwnerDto })
  @ValidateNested()
  @Type(() => PodcastOwnerDto)
  owner!: PodcastOwnerDto;

  @ApiProperty({ type: () => [PodcastEpisodeSummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PodcastEpisodeSummaryDto)
  episodes!: PodcastEpisodeSummaryDto[];

  @ApiProperty({ type: () => [PodcastCategorySummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PodcastCategorySummaryDto)
  categories!: PodcastCategorySummaryDto[];
}
