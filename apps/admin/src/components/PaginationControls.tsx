import React from 'react';
import { PaginationMeta, PAGE_SIZE_OPTIONS, getPageRange } from '../types/pagination';

export interface PaginationControlsProps {
  /** Pagination metadata from API response */
  meta: PaginationMeta;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (limit: number) => void;
  /** Whether to show page size selector */
  showPageSize?: boolean;
  /** Whether to show info text (e.g., "Showing 1-10 of 100") */
  showInfo?: boolean;
  /** Maximum number of page buttons to show */
  maxPageButtons?: number;
  /** Custom class name */
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  meta,
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  showInfo = true,
  maxPageButtons = 7,
  className = '',
}) => {
  const { page, limit, total, totalPages, hasNextPage, hasPrevPage } = meta;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const pageRange = getPageRange(page, totalPages, maxPageButtons);

  if (total === 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 ${className}`}>
      {/* Info Text */}
      {showInfo && (
        <div className="flex flex-1 justify-between sm:hidden">
          <span className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </span>
        </div>
      )}

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        {/* Left: Info and Page Size */}
        <div className="flex items-center gap-4">
          {showInfo && (
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </p>
          )}

          {showPageSize && (
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-gray-700">
                Per page:
              </label>
              <select
                id="page-size"
                value={limit}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Pagination Buttons */}
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
            className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
              !hasPrevPage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
            aria-label="Previous page"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Page Numbers */}
          {pageRange.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = pageNum === page;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  isCurrentPage
                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                    : 'text-gray-900'
                }`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
              !hasNextPage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
            aria-label="Next page"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile Pagination */}
      <div className="flex sm:hidden gap-2 w-full justify-between">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className={`relative inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
            !hasPrevPage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          Previous
        </button>
        <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className={`relative inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
            !hasNextPage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};
