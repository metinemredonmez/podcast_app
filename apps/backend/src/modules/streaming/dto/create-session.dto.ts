import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StreamStatus } from '@podcast-app/shared-types';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  hostId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  podcastId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @ApiPropertyOptional({ enum: StreamStatus, default: StreamStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(StreamStatus)
  status?: StreamStatus;
}
