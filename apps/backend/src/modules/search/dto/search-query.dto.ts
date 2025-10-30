import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum SearchDomain {
  PODCAST = 'podcast',
  EPISODE = 'episode',
  USER = 'user',
}

export class SearchQueryDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  query?: string;

  @ApiPropertyOptional({ enum: SearchDomain, default: SearchDomain.PODCAST })
  @IsOptional()
  @IsEnum(SearchDomain)
  domain?: SearchDomain = SearchDomain.PODCAST;
}
