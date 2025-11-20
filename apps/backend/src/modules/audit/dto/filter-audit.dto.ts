import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterAuditDto {
  @ApiPropertyOptional({ example: 'user-123', description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'CREATE', description: 'Filter by action (CREATE, UPDATE, DELETE)' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'Podcast', description: 'Filter by entity type (User, Podcast, Episode)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ example: 'entity-456', description: 'Filter by entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z', description: 'Filter from date' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'Filter to date' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
