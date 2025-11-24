import { useState, useCallback, useMemo } from 'react';

export interface BulkSelectionState<T = string> {
  selectedIds: Set<T>;
  isAllSelected: boolean;
  isAllPagesSelected: boolean;
}

export interface UseBulkSelectionReturn<T = string> {
  selectedIds: Set<T>;
  isAllSelected: boolean;
  isAllPagesSelected: boolean;
  selectedCount: number;
  toggleSelectAll: () => void;
  toggleSelectAllPages: () => void;
  toggleSelectItem: (id: T) => void;
  isSelected: (id: T) => boolean;
  clearSelection: () => void;
  selectItems: (ids: T[]) => void;
}

export interface UseBulkSelectionOptions<T = string> {
  currentPageIds: T[];
  totalCount?: number;
  onSelectAllPages?: (selected: boolean) => void;
}

export function useBulkSelection<T = string>({
  currentPageIds,
  totalCount,
  onSelectAllPages,
}: UseBulkSelectionOptions<T>): UseBulkSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());
  const [isAllPagesSelected, setIsAllPagesSelected] = useState(false);

  // Check if all items on current page are selected
  const isAllSelected = useMemo(() => {
    if (currentPageIds.length === 0) return false;
    return currentPageIds.every((id) => selectedIds.has(id));
  }, [currentPageIds, selectedIds]);

  // Get selected count
  const selectedCount = useMemo(() => {
    if (isAllPagesSelected && totalCount) {
      return totalCount;
    }
    return selectedIds.size;
  }, [isAllPagesSelected, totalCount, selectedIds.size]);

  // Toggle select all on current page
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (isAllSelected) {
        // Deselect all on current page
        currentPageIds.forEach((id) => newSet.delete(id));
      } else {
        // Select all on current page
        currentPageIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
    setIsAllPagesSelected(false);
  }, [isAllSelected, currentPageIds]);

  // Toggle select all pages
  const toggleSelectAllPages = useCallback(() => {
    const newValue = !isAllPagesSelected;
    setIsAllPagesSelected(newValue);
    if (newValue) {
      // When selecting all pages, also select current page items
      setSelectedIds(new Set(currentPageIds));
    } else {
      // When deselecting all pages, clear selection
      setSelectedIds(new Set());
    }
    onSelectAllPages?.(newValue);
  }, [isAllPagesSelected, currentPageIds, onSelectAllPages]);

  // Toggle individual item
  const toggleSelectItem = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    setIsAllPagesSelected(false);
  }, []);

  // Check if item is selected
  const isSelected = useCallback(
    (id: T) => {
      return isAllPagesSelected || selectedIds.has(id);
    },
    [selectedIds, isAllPagesSelected]
  );

  // Clear all selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsAllPagesSelected(false);
  }, []);

  // Select specific items
  const selectItems = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
    setIsAllPagesSelected(false);
  }, []);

  return {
    selectedIds,
    isAllSelected,
    isAllPagesSelected,
    selectedCount,
    toggleSelectAll,
    toggleSelectAllPages,
    toggleSelectItem,
    isSelected,
    clearSelection,
    selectItems,
  };
}
