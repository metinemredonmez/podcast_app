/**
 * Pagination query parameters for API requests
 */
export interface PaginationParams {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Search term */
  search?: string;
}

/**
 * Pagination metadata returned from API
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
}

/**
 * Standard paginated API response
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Page size options for pagination dropdown
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Build query string from pagination params
 */
export function buildPaginationQueryString(params: Partial<PaginationParams>): string {
  const query = new URLSearchParams();

  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);
  if (params.search) query.append('search', params.search);

  return query.toString();
}

/**
 * Parse pagination params from URL search params
 */
export function parsePaginationFromURL(searchParams: URLSearchParams): Partial<PaginationParams> {
  return {
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    search: searchParams.get('search') || undefined,
  };
}

/**
 * Calculate total pages from total items and page size
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Get page range for pagination controls (e.g., [1, 2, 3, ..., 10])
 */
export function getPageRange(currentPage: number, totalPages: number, maxButtons: number = 5): (number | string)[] {
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const halfButtons = Math.floor(maxButtons / 2);

  let startPage = Math.max(1, currentPage - halfButtons);
  let endPage = Math.min(totalPages, currentPage + halfButtons);

  // Adjust if we're near the start
  if (currentPage <= halfButtons) {
    endPage = maxButtons;
  }

  // Adjust if we're near the end
  if (currentPage >= totalPages - halfButtons) {
    startPage = totalPages - maxButtons + 1;
  }

  // Add first page
  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push('...');
    }
  }

  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Add last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
  }

  return pages;
}
