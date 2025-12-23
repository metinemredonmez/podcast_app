import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Typography,
  Alert,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  IconFileTypeCsv,
  IconFileTypeXls,
  IconFileTypePdf,
  IconJson,
  IconDownload,
} from '@tabler/icons-react';
import { exportWithFormatting } from '../../utils/export';
import { logger } from '../../utils/logger';

export type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf';

export interface ExportColumn<T = any> {
  key: keyof T;
  label: string;
}

export interface ExportDialogProps<T = any> {
  open: boolean;
  onClose: () => void;
  data: T[];
  filename: string;
  title?: string;
  columns: ExportColumn<T>[];
  defaultFormat?: ExportFormat;
}

const formatIcons: Record<ExportFormat, React.ReactNode> = {
  csv: <IconFileTypeCsv size={24} />,
  excel: <IconFileTypeXls size={24} />,
  json: <IconJson size={24} />,
  pdf: <IconFileTypePdf size={24} />,
};

const formatDescriptions: Record<ExportFormat, string> = {
  csv: 'Comma-separated values - Compatible with Excel, Google Sheets, and most data tools',
  excel: 'Excel spreadsheet format - Best for detailed analysis in Microsoft Excel',
  json: 'JavaScript Object Notation - Ideal for developers and API integration',
  pdf: 'Portable Document Format - Best for printing and sharing reports',
};

export function ExportDialog<T extends Record<string, any>>({
  open,
  onClose,
  data,
  filename,
  title,
  columns,
  defaultFormat = 'csv',
}: ExportDialogProps<T>): React.ReactElement {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      exportWithFormatting(data, format, filename, {
        columns,
        title: title || filename,
      });
      // Close dialog after a short delay to show success
      setTimeout(() => {
        onClose();
        setExporting(false);
      }, 500);
    } catch (error) {
      logger.error('Export failed:', error);
      setExporting(false);
    }
  };

  const handleClose = () => {
    if (!exporting) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconDownload size={24} />
          <span>Export Data</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Info Alert */}
          <Alert severity="info">
            Exporting <strong>{data.length}</strong> {data.length === 1 ? 'item' : 'items'} with{' '}
            <strong>{columns.length}</strong> {columns.length === 1 ? 'column' : 'columns'}
          </Alert>

          {/* Format Selection */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
              Select Export Format
            </FormLabel>
            <RadioGroup value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
              <Stack spacing={1.5}>
                {(['csv', 'excel', 'json', 'pdf'] as ExportFormat[]).map((fmt) => (
                  <Box
                    key={fmt}
                    sx={{
                      border: '1px solid',
                      borderColor: format === fmt ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: format === fmt ? 'action.selected' : 'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => setFormat(fmt)}
                  >
                    <FormControlLabel
                      value={fmt}
                      control={<Radio />}
                      label={
                        <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                          {formatIcons[fmt]}
                          <Box flex={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body1" fontWeight={500}>
                                {fmt.toUpperCase()}
                              </Typography>
                              {fmt === 'excel' && (
                                <Chip label="Recommended" size="small" color="primary" sx={{ height: 20 }} />
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {formatDescriptions[fmt]}
                            </Typography>
                          </Box>
                        </Stack>
                      }
                      sx={{ m: 0, width: '100%' }}
                    />
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Columns Preview */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Columns to Export
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {columns.map((col) => (
                <Chip key={String(col.key)} label={col.label} size="small" variant="outlined" />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={exporting}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<IconDownload size={18} />} onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
