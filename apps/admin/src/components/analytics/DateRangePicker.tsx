import React, { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  TextField,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Divider,
} from '@mui/material';
import { IconCalendar, IconChevronDown } from '@tabler/icons-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  showCompare?: boolean;
  onCompareChange?: (enabled: boolean) => void;
  compareEnabled?: boolean;
}

const presets = [
  { label: 'Today', value: 'today', getDates: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Last 7 days', value: '7d', getDates: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: 'Last 30 days', value: '30d', getDates: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: 'Last 90 days', value: '90d', getDates: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  showCompare = false,
  onCompareChange,
  compareEnabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('30d');
  const [customFrom, setCustomFrom] = useState(format(value.from, 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(value.to, 'yyyy-MM-dd'));

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const presetConfig = presets.find((p) => p.value === preset);
    if (presetConfig) {
      const dates = presetConfig.getDates();
      onChange({ ...dates, label: presetConfig.label });
      handleClose();
    }
  };

  const handleCustomApply = () => {
    const from = new Date(customFrom);
    const to = new Date(customTo);
    onChange({
      from,
      to,
      label: `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`,
    });
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpen}
        startIcon={<IconCalendar size={18} />}
        endIcon={<IconChevronDown size={18} />}
        sx={{ minWidth: 200 }}
      >
        {value.label}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 320 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Select Date Range
          </Typography>

          <ToggleButtonGroup
            value={selectedPreset}
            exclusive
            onChange={(_, value) => value && handlePresetChange(value)}
            orientation="vertical"
            fullWidth
            sx={{ mb: 2 }}
          >
            {presets.map((preset) => (
              <ToggleButton key={preset.value} value={preset.value} sx={{ justifyContent: 'flex-start' }}>
                {preset.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Custom Range
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              label="From"
              type="date"
              size="small"
              fullWidth
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              fullWidth
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" fullWidth onClick={handleCustomApply}>
              Apply Custom Range
            </Button>
          </Stack>

          {showCompare && (
            <>
              <Divider sx={{ my: 2 }} />
              <Button
                variant={compareEnabled ? 'contained' : 'outlined'}
                fullWidth
                size="small"
                onClick={() => onCompareChange?.(!compareEnabled)}
              >
                {compareEnabled ? 'Comparing with Previous Period' : 'Compare with Previous Period'}
              </Button>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};
