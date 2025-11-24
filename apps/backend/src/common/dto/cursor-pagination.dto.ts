import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string; // base64-encoded id

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number; // for offset pagination

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  orderBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  search?: string; // for filtering/searching

  @IsOptional()
  @IsString()
  role?: string; // for role filtering
}

export interface PaginatedResponseDto<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}


