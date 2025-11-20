import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { CursorPaginationDto } from '../../../common/dto/cursor-pagination.dto';

export class SearchPodcastsDto extends CursorPaginationDto {
  @ApiPropertyOptional({ description: 'Search term for title and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by owner/creator ID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by published status', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Tenant ID override (admins only)' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
