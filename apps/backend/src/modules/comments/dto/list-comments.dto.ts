import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { OffsetPaginationDto } from '../../../common/dto/offset-pagination.dto';

export class ListCommentsDto extends OffsetPaginationDto {
  @ApiProperty({ format: 'uuid', description: 'Tenant ID (required)' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by episode ID' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by podcast ID' })
  @IsOptional()
  @IsUUID()
  podcastId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
