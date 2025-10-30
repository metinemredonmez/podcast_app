import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StreamStatus } from '../../../common/enums/prisma.enums';

export class StartStreamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

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

  @ApiPropertyOptional({ enum: StreamStatus })
  @IsOptional()
  @IsEnum(StreamStatus)
  status?: StreamStatus;
}
