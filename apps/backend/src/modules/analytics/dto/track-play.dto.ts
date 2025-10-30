import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalyticsEventType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class TrackPlayDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  episodeId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  podcastId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ enum: AnalyticsEventType, default: AnalyticsEventType.PODCAST_PLAY })
  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType = AnalyticsEventType.PODCAST_PLAY;

  @ApiPropertyOptional({ description: 'Arbitrary metadata JSON encoded as string' })
  @IsOptional()
  @IsString()
  metadata?: string;

  @ApiPropertyOptional({ description: 'Listen progress (seconds)' })
  @IsOptional()
  @IsNumber()
  progressSeconds?: number;
}
