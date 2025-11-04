import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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

  @ApiProperty()
  @IsString()
  audioUrl!: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt!: Date | null;

  @ApiProperty()
  @IsBoolean()
  isPublished!: boolean;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsNumber()
  episodeNumber!: number | null;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt!: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt!: Date;
}
