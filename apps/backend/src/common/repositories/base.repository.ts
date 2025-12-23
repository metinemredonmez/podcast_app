/**
 * Base Repository Interface
 * Provides common CRUD operations for all repositories
 */
export interface BaseRepository<T, CreateInput, UpdateInput> {
  findById(id: string, tenantId: string): Promise<T | null>;
  findMany(options: BaseFindManyOptions): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, tenantId: string, data: UpdateInput): Promise<T>;
  delete(id: string, tenantId: string): Promise<void>;
  count(options: BaseCountOptions): Promise<number>;
}

export interface BaseFindManyOptions {
  tenantId: string;
  cursor?: string;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface BaseCountOptions {
  tenantId: string;
  where?: Record<string, unknown>;
}

/**
 * Pagination utilities
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export function buildPaginatedResult<T>(
  items: T[],
  limit: number,
  total: number,
  getCursor: (item: T) => string,
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && data.length > 0 ? getCursor(data[data.length - 1]) : undefined;

  return {
    data,
    total,
    hasMore,
    nextCursor,
  };
}

/**
 * Common repository error types
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class EntityNotFoundError extends RepositoryError {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id ${id} not found`, 'ENTITY_NOT_FOUND', { entityType, id });
    this.name = 'EntityNotFoundError';
  }
}

export class DuplicateEntityError extends RepositoryError {
  constructor(entityType: string, field: string, value: string) {
    super(`${entityType} with ${field} "${value}" already exists`, 'DUPLICATE_ENTITY', {
      entityType,
      field,
      value,
    });
    this.name = 'DuplicateEntityError';
  }
}
