import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Date range type
export interface DateRangeValue {
  from?: string;
  to?: string;
}

// Filter value can be string, number, boolean, array of strings, or date range
export type FilterValueType = string | number | boolean | string[] | DateRangeValue | null | undefined;

export interface FilterValue {
  [key: string]: FilterValueType;
}

export interface FilterDefinition {
  key: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'checkbox' | 'number';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: FilterValueType;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterValue;
  createdAt: string;
}

export interface UseFiltersReturn {
  filters: FilterValue;
  setFilter: (key: string, value: FilterValueType) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  activeFilterCount: number;
  activeFilters: { key: string; value: FilterValueType; label: string }[];
  savedFilters: SavedFilter[];
  saveCurrentFilters: (name: string) => void;
  loadSavedFilter: (filter: SavedFilter) => void;
  deleteSavedFilter: (id: string) => void;
}

interface UseFiltersOptions {
  definitions: FilterDefinition[];
  storageKey?: string;
  syncWithUrl?: boolean;
  onFilterChange?: (filters: FilterValue) => void;
}

export function useFilters({
  definitions,
  storageKey = 'filters',
  syncWithUrl = true,
  onFilterChange,
}: UseFiltersOptions): UseFiltersReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterValue>(() => {
    // Initialize from URL params if syncWithUrl is true
    if (syncWithUrl) {
      const urlFilters: FilterValue = {};
      definitions.forEach((def) => {
        const urlValue = searchParams.get(def.key);
        if (urlValue !== null) {
          // Parse value based on type
          switch (def.type) {
            case 'multiselect':
              urlFilters[def.key] = urlValue.split(',');
              break;
            case 'checkbox':
              urlFilters[def.key] = urlValue === 'true';
              break;
            case 'number':
              urlFilters[def.key] = Number(urlValue);
              break;
            case 'daterange':
              const [from, to] = urlValue.split('~');
              urlFilters[def.key] = { from, to };
              break;
            default:
              urlFilters[def.key] = urlValue;
          }
        } else if (def.defaultValue !== undefined) {
          urlFilters[def.key] = def.defaultValue;
        }
      });
      return urlFilters;
    }

    // Initialize with default values
    const initialFilters: FilterValue = {};
    definitions.forEach((def) => {
      if (def.defaultValue !== undefined) {
        initialFilters[def.key] = def.defaultValue;
      }
    });
    return initialFilters;
  });

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    // Load saved filters from localStorage
    const saved = localStorage.getItem(`${storageKey}_saved`);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync filters with URL
  useEffect(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const def = definitions.find((d) => d.key === key);
        if (!def) return;

        // Serialize value based on type
        switch (def.type) {
          case 'multiselect':
            if (Array.isArray(value) && value.length > 0) {
              params.set(key, value.join(','));
            }
            break;
          case 'checkbox':
            if (value === true) {
              params.set(key, 'true');
            }
            break;
          case 'daterange': {
            const dateRange = value as { from?: string; to?: string };
            if (dateRange.from && dateRange.to) {
              params.set(key, `${dateRange.from}~${dateRange.to}`);
            }
            break;
          }
          default:
            params.set(key, String(value));
        }
      }
    });

    setSearchParams(params, { replace: true });
  }, [filters, syncWithUrl, definitions, setSearchParams]);

  // Notify filter changes
  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const setFilter = useCallback((key: string, value: FilterValueType) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter((key) => {
      const value = filters[key];
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;
  }, [filters]);

  const activeFilters = useMemo(() => {
    return Object.entries(filters)
      .filter(([_, value]) => {
        if (value === undefined || value === null || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      })
      .map(([key, value]) => {
        const def = definitions.find((d) => d.key === key);
        let displayValue = value;

        // Format display value
        if (def?.type === 'multiselect' && Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (def?.type === 'select' && def.options) {
          const option = def.options.find((o) => o.value === value);
          displayValue = option?.label || value;
        } else if (def?.type === 'daterange' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const dateRange = value as { from?: string; to?: string };
          if (dateRange.from && dateRange.to) {
            displayValue = `${dateRange.from} - ${dateRange.to}`;
          }
        }

        return {
          key,
          value,
          label: `${def?.label || key}: ${displayValue}`,
        };
      });
  }, [filters, definitions]);

  const saveFilter = useCallback(
    (name: string) => {
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
      };
      const updated = [...savedFilters, newFilter];
      setSavedFilters(updated);
      localStorage.setItem(`${storageKey}_saved`, JSON.stringify(updated));
    },
    [filters, savedFilters, storageKey]
  );

  const loadFilter = useCallback(
    (filter: SavedFilter) => {
      setFilters(filter.filters);
    },
    []
  );

  const deleteSavedFilter = useCallback(
    (id: string) => {
      const updated = savedFilters.filter((f) => f.id !== id);
      setSavedFilters(updated);
      localStorage.setItem(`${storageKey}_saved`, JSON.stringify(updated));
    },
    [savedFilters, storageKey]
  );

  const applyFilters = useCallback(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  return {
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    resetFilters: clearFilters,
    activeFilterCount,
    activeFilters,
    savedFilters,
    saveCurrentFilters: saveFilter,
    loadSavedFilter: loadFilter,
    deleteSavedFilter,
  };
}
