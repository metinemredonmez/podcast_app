import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class ListStreamingDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ type: String, enum: ['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'] })
  @IsOptional()
  @IsIn(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'])
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  hostId?: string;

  @ApiPropertyOptional({ description: 'Page number starting from 1', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
