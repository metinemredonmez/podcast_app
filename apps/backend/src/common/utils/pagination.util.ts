export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginationMeta extends PaginationOptions {
  total: number;
}

export const buildPagination = (page = 1, pageSize = 25): PaginationOptions => ({ page, pageSize });
