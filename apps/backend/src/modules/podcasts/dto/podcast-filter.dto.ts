import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class PodcastFilterDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter podcasts by tenant identifier' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter podcasts owned by a specific user' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter podcasts attached to a category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by publication status' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ maxLength: 200, description: 'Substring search within title or description' })
  @IsOptional()
  @IsString()
  search?: string;
}
