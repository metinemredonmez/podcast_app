import { PaginatedResponseDto } from '../dto/cursor-pagination.dto';
import { OffsetPaginationDto, PaginationMeta as OffsetPaginationMeta, OffsetPaginatedResponse } from '../dto/offset-pagination.dto';

// ==================== CURSOR-BASED PAGINATION ====================

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

export function buildCursorPaginatedResponse<T>(rows: T[], limit: number, idSelector: (row: T) => string): PaginatedResponseDto<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && data.length > 0 ? encodeCursor(idSelector(data[data.length - 1])) : null;
  return { data, nextCursor, hasMore };
}

// ==================== OFFSET-BASED PAGINATION ====================

/**
 * Calculate the number of records to skip for offset-based pagination
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total number of pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Build pagination metadata for offset-based pagination
 */
export function buildPaginationMeta(total: number, page: number, limit: number): OffsetPaginationMeta {
  const totalPages = calculateTotalPages(total, limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Build a complete paginated response for offset-based pagination
 */
export function buildOffsetPaginatedResponse<T>(data: T[], total: number, page: number, limit: number): OffsetPaginatedResponse<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * Build Prisma query object for offset-based pagination
 */
export function buildPrismaOffsetQuery(dto: OffsetPaginationDto) {
  const page = Number(dto.page ?? 1);
  const limit = Number(dto.limit ?? 10);
  const sortBy = dto.sortBy ?? 'createdAt';
  const sortOrder = dto.sortOrder ?? 'desc';

  return {
    skip: calculateSkip(page, limit),
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  };
}

/**
 * Build Prisma query object with where clause for offset-based pagination
 */
export function buildPrismaOffsetQueryWithWhere<T>(dto: OffsetPaginationDto, whereClause: T) {
  return {
    where: whereClause,
    ...buildPrismaOffsetQuery(dto),
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(page: number, limit: number): void {
  if (page < 1) {
    throw new Error('Page must be >= 1');
  }
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
}

// ==================== LEGACY SUPPORT ====================

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginationMeta extends PaginationOptions {
  total: number;
}

export const buildPagination = (page = 1, pageSize = 25): PaginationOptions => ({ page, pageSize });

/**
 * @deprecated Use buildOffsetPaginatedResponse instead
 */
export const buildPaginatedResponse = buildCursorPaginatedResponse;
