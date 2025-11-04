import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum SearchEntityType {
  PODCAST = 'podcast',
  EPISODE = 'episode',
  ALL = 'all',
}

export class SearchQueryDto {
  @ApiProperty({ description: 'Search text query', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  query!: string;

  @ApiPropertyOptional({ enum: SearchEntityType, default: SearchEntityType.ALL })
  @IsOptional()
  @IsEnum(SearchEntityType)
  type?: SearchEntityType = SearchEntityType.ALL;

  @ApiPropertyOptional({ format: 'uuid', description: 'Restrict results to a tenant' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Restrict podcasts to a category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter podcasts and episodes by published status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;
}
