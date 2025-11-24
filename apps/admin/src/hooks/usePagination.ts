import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaginationParams, DEFAULT_PAGINATION, parsePaginationFromURL } from '../types/pagination';

export interface UsePaginationOptions {
  /** Initial page number */
  initialPage?: number;
  /** Initial page size */
  initialLimit?: number;
  /** Initial sort field */
  initialSortBy?: string;
  /** Initial sort direction */
  initialSortOrder?: 'asc' | 'desc';
  /** Whether to sync with URL query params */
  syncWithURL?: boolean;
  /** Callback when pagination changes */
  onPaginationChange?: (params: PaginationParams) => void;
}

export interface UsePaginationReturn {
  /** Current page number (1-indexed) */
  page: number;
  /** Current page size */
  limit: number;
  /** Current sort field */
  sortBy: string;
  /** Current sort direction */
  sortOrder: 'asc' | 'desc';
  /** Current search term */
  search: string;
  /** All pagination params as object */
  paginationParams: PaginationParams;
  /** Set page number */
  setPage: (page: number) => void;
  /** Set page size */
  setLimit: (limit: number) => void;
  /** Set sort field and direction */
  setSort: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
  /** Set search term */
  setSearch: (search: string) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to first page */
  firstPage: () => void;
  /** Go to last page */
  lastPage: (totalPages: number) => void;
  /** Reset pagination to defaults */
  reset: () => void;
}

/**
 * Hook for managing pagination state with URL sync
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = DEFAULT_PAGINATION.page,
    initialLimit = DEFAULT_PAGINATION.limit,
    initialSortBy = DEFAULT_PAGINATION.sortBy || 'createdAt',
    initialSortOrder = DEFAULT_PAGINATION.sortOrder || 'desc',
    syncWithURL = true,
    onPaginationChange,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL if sync is enabled, otherwise use initial values
  const getInitialValue = <T,>(urlKey: string, initialValue: T, parser?: (val: string) => T): T => {
    if (!syncWithURL) return initialValue;
    const urlValue = searchParams.get(urlKey);
    if (!urlValue) return initialValue;
    return parser ? parser(urlValue) : (urlValue as T);
  };

  const [page, setPageState] = useState<number>(() =>
    getInitialValue('page', initialPage, (val) => parseInt(val) || initialPage)
  );

  const [limit, setLimitState] = useState<number>(() =>
    getInitialValue('limit', initialLimit, (val) => parseInt(val) || initialLimit)
  );

  const [sortBy, setSortByState] = useState<string>(() => getInitialValue('sortBy', initialSortBy));

  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(() =>
    getInitialValue('sortOrder', initialSortOrder, (val) => (val === 'asc' || val === 'desc' ? val : initialSortOrder))
  );

  const [search, setSearchState] = useState<string>(() => getInitialValue('search', ''));

  // Update URL when pagination state changes
  const updateURL = useCallback(
    (updates: Partial<PaginationParams>) => {
      if (!syncWithURL) return;

      const newParams = new URLSearchParams(searchParams);

      if (updates.page !== undefined) {
        newParams.set('page', updates.page.toString());
      }
      if (updates.limit !== undefined) {
        newParams.set('limit', updates.limit.toString());
      }
      if (updates.sortBy !== undefined) {
        newParams.set('sortBy', updates.sortBy);
      }
      if (updates.sortOrder !== undefined) {
        newParams.set('sortOrder', updates.sortOrder);
      }
      if (updates.search !== undefined) {
        if (updates.search) {
          newParams.set('search', updates.search);
        } else {
          newParams.delete('search');
        }
      }

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams, syncWithURL]
  );

  // Pagination params object
  const paginationParams: PaginationParams = {
    page,
    limit,
    sortBy,
    sortOrder,
    search,
  };

  // Notify parent component of changes
  useEffect(() => {
    onPaginationChange?.(paginationParams);
  }, [page, limit, sortBy, sortOrder, search]);

  const setPage = useCallback(
    (newPage: number) => {
      if (newPage < 1) return;
      setPageState(newPage);
      updateURL({ page: newPage });
    },
    [updateURL]
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      setLimitState(newLimit);
      setPageState(1); // Reset to first page when limit changes
      updateURL({ limit: newLimit, page: 1 });
    },
    [updateURL]
  );

  const setSort = useCallback(
    (newSortBy: string, newSortOrder?: 'asc' | 'desc') => {
      const order = newSortOrder || (sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc');
      setSortByState(newSortBy);
      setSortOrderState(order);
      setPageState(1); // Reset to first page when sorting changes
      updateURL({ sortBy: newSortBy, sortOrder: order, page: 1 });
    },
    [sortBy, sortOrder, updateURL]
  );

  const setSearch = useCallback(
    (newSearch: string) => {
      setSearchState(newSearch);
      setPageState(1); // Reset to first page when search changes
      updateURL({ search: newSearch, page: 1 });
    },
    [updateURL]
  );

  const nextPage = useCallback(() => {
    setPage(page + 1);
  }, [page, setPage]);

  const prevPage = useCallback(() => {
    setPage(Math.max(1, page - 1));
  }, [page, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(
    (totalPages: number) => {
      setPage(totalPages);
    },
    [setPage]
  );

  const reset = useCallback(() => {
    setPageState(initialPage);
    setLimitState(initialLimit);
    setSortByState(initialSortBy);
    setSortOrderState(initialSortOrder);
    setSearchState('');
    updateURL({
      page: initialPage,
      limit: initialLimit,
      sortBy: initialSortBy,
      sortOrder: initialSortOrder,
      search: '',
    });
  }, [initialPage, initialLimit, initialSortBy, initialSortOrder, updateURL]);

  return {
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    paginationParams,
    setPage,
    setLimit,
    setSort,
    setSearch,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
  };
}
