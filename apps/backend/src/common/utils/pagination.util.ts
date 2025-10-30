import { PaginatedResponseDto } from '../dto/cursor-pagination.dto';

export function encodeCursor(id: string | number): string {
  return Buffer.from(String(id)).toString('base64');
}

export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

export function buildPaginatedResponse<T>(rows: T[], limit: number, idSelector: (row: T) => string): PaginatedResponseDto<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && data.length > 0 ? encodeCursor(idSelector(data[data.length - 1])) : null;
  return { data, nextCursor, hasMore };
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginationMeta extends PaginationOptions {
  total: number;
}

export const buildPagination = (page = 1, pageSize = 25): PaginationOptions => ({ page, pageSize });
