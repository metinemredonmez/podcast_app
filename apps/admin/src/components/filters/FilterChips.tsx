import React from 'react';
import { Box, Chip, Stack, Button } from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { FilterValue, FilterDefinition } from '../../hooks/useFilters';

export interface FilterChipsProps {
  filters: FilterValue;
  definitions: FilterDefinition[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  definitions,
  onRemoveFilter,
  onClearAll,
}) => {
  const getFilterLabel = (key: string, value: any): string | null => {
    const definition = definitions.find((d) => d.key === key);
    if (!definition) return null;

    // Skip empty values
    if (value === undefined || value === null || value === '') return null;
    if (Array.isArray(value) && value.length === 0) return null;
    if (typeof value === 'object' && Object.keys(value).length === 0) return null;

    let displayValue: string;

    switch (definition.type) {
      case 'text':
      case 'number':
        displayValue = String(value);
        break;

      case 'select':
        const option = definition.options?.find((o) => o.value === value);
        displayValue = option?.label || String(value);
        break;

      case 'multiselect':
        if (!Array.isArray(value)) return null;
        const selectedOptions = definition.options?.filter((o) => value.includes(o.value));
        displayValue = selectedOptions?.map((o) => o.label).join(', ') || '';
        break;

      case 'checkbox':
        displayValue = value ? 'Yes' : 'No';
        if (!value) return null; // Don't show unchecked checkboxes
        break;

      case 'date':
        displayValue = new Date(value).toLocaleDateString();
        break;

      case 'daterange':
        const from = value.from ? new Date(value.from).toLocaleDateString() : '';
        const to = value.to ? new Date(value.to).toLocaleDateString() : '';
        if (!from && !to) return null;
        displayValue = from && to ? `${from} - ${to}` : from || to;
        break;

      default:
        displayValue = String(value);
    }

    return `${definition.label}: ${displayValue}`;
  };

  const activeFilters = Object.entries(filters)
    .map(([key, value]) => {
      const label = getFilterLabel(key, value);
      return label ? { key, label } : null;
    })
    .filter((f): f is { key: string; label: string } => f !== null);

  if (activeFilters.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        {activeFilters.map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            size="small"
            onDelete={() => onRemoveFilter(key)}
            deleteIcon={<IconX size={14} />}
            sx={{ mb: 1 }}
          />
        ))}
        {activeFilters.length > 1 && (
          <Button size="small" onClick={onClearAll} sx={{ mb: 1 }}>
            Clear all
          </Button>
        )}
      </Stack>
    </Box>
  );
};
