import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalyticsEventType } from '../../../common/enums/prisma.enums';
import { IsEnum, IsISO8601, IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateAnalyticsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  podcastId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @ApiProperty({ enum: AnalyticsEventType })
  @IsEnum(AnalyticsEventType)
  eventType!: AnalyticsEventType;

  @ApiPropertyOptional({ description: 'Arbitrary metadata payload', type: () => Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'ISO timestamp when event occurred' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
