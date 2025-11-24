import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Button,
  Divider,
  IconButton,
  Chip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  IconX,
  IconFilter,
  IconDeviceFloppy,
  IconTrash,
  IconChevronDown,
} from '@tabler/icons-react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FilterDefinition, FilterValue, SavedFilter } from '../../hooks/useFilters';

export interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: FilterValue;
  definitions: FilterDefinition[];
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  onDeleteFilter?: (id: string) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  open,
  onClose,
  filters,
  definitions,
  onFilterChange,
  onReset,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
}) => {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [filterName, setFilterName] = React.useState('');
  const [savedFiltersAnchorEl, setSavedFiltersAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleSaveFilter = () => {
    if (filterName.trim() && onSaveFilter) {
      onSaveFilter(filterName.trim());
      setFilterName('');
      setSaveDialogOpen(false);
    }
  };

  const renderFilterInput = (definition: FilterDefinition) => {
    const value = filters[definition.key];

    switch (definition.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            size="small"
            placeholder={definition.placeholder}
            value={value || ''}
            onChange={(e) => onFilterChange(definition.key, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            fullWidth
            size="small"
            value={value || ''}
            onChange={(e) => onFilterChange(definition.key, e.target.value)}
            displayEmpty
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {definition.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        );

      case 'multiselect':
        return (
          <FormGroup>
            {definition.options?.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    size="small"
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v) => v !== option.value);
                      onFilterChange(definition.key, newValues);
                    }}
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => onFilterChange(definition.key, e.target.checked)}
              />
            }
            label={definition.label}
          />
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={definition.placeholder}
              value={value ? new Date(value) : null}
              onChange={(date) => onFilterChange(definition.key, date?.toISOString())}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </LocalizationProvider>
        );

      case 'daterange':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={2}>
              <DatePicker
                label="From"
                value={value?.from ? new Date(value.from) : null}
                onChange={(date) =>
                  onFilterChange(definition.key, {
                    ...value,
                    from: date?.toISOString(),
                  })
                }
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <DatePicker
                label="To"
                value={value?.to ? new Date(value.to) : null}
                onChange={(date) =>
                  onFilterChange(definition.key, {
                    ...value,
                    to: date?.toISOString(),
                  })
                }
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Stack>
          </LocalizationProvider>
        );

      case 'number':
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            placeholder={definition.placeholder}
            value={value || ''}
            onChange={(e) => onFilterChange(definition.key, e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
    return v !== undefined && v !== '' && v !== null;
  }).length;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 320, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconFilter size={20} />
              <Typography variant="h6">Filters</Typography>
              {activeFilterCount > 0 && (
                <Chip label={activeFilterCount} size="small" color="primary" />
              )}
            </Stack>
            <IconButton size="small" onClick={onClose}>
              <IconX size={20} />
            </IconButton>
          </Stack>
        </Box>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              endIcon={<IconChevronDown size={16} />}
              onClick={(e) => setSavedFiltersAnchorEl(e.currentTarget)}
            >
              Load Saved Filter
            </Button>
            <Menu
              anchorEl={savedFiltersAnchorEl}
              open={Boolean(savedFiltersAnchorEl)}
              onClose={() => setSavedFiltersAnchorEl(null)}
            >
              {savedFilters.map((savedFilter) => (
                <MenuItem
                  key={savedFilter.id}
                  onClick={() => {
                    onLoadFilter?.(savedFilter);
                    setSavedFiltersAnchorEl(null);
                  }}
                >
                  <ListItemText primary={savedFilter.name} />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFilter?.(savedFilter.id);
                    }}
                  >
                    <IconTrash size={16} />
                  </IconButton>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          <Stack spacing={3}>
            {definitions.map((definition) => (
              <FormControl key={definition.key} fullWidth>
                {definition.type !== 'checkbox' && (
                  <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                    {definition.label}
                  </FormLabel>
                )}
                {renderFilterInput(definition)}
              </FormControl>
            ))}
          </Stack>
        </Box>

        {/* Footer Actions */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack spacing={1.5}>
            {!saveDialogOpen ? (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<IconDeviceFloppy size={16} />}
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={activeFilterCount === 0}
                >
                  Save Filter
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="outlined" size="small" onClick={onReset}>
                    Reset
                  </Button>
                  <Button fullWidth variant="contained" size="small" onClick={onClose}>
                    Apply
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Filter name"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  autoFocus
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSaveDialogOpen(false);
                      setFilterName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={handleSaveFilter}
                    disabled={!filterName.trim()}
                  >
                    Save
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};
