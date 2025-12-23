import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

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

  @ApiPropertyOptional({
    type: String,
    enum: ['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'],
    default: 'SCHEDULED'
  })
  @IsOptional()
  @IsIn(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'])
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
}
