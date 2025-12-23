import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Stack,
  Collapse,
  alpha,
} from '@mui/material';
import {
  IconTrash,
  IconX,
  IconChevronDown,
  IconCheck,
  IconAlertCircle,
  IconDownload,
  IconBell,
  IconCategory,
} from '@tabler/icons-react';
import { logger } from '../../utils/logger';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  showProgress?: boolean;
}

export interface BulkActionsProps {
  selectedCount: number;
  totalCount?: number;
  isAllPagesSelected?: boolean;
  onClearSelection: () => void;
  onSelectAllPages?: () => void;
  actions: BulkAction[];
  onAction: (actionId: string) => Promise<void>;
  children?: React.ReactNode;
}

interface ActionProgress {
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  totalCount,
  isAllPagesSelected,
  onClearSelection,
  onSelectAllPages,
  actions,
  onAction,
  children,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ActionProgress | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action: BulkAction) => {
    handleMenuClose();
    if (action.requiresConfirmation) {
      setSelectedAction(action);
      setConfirmDialogOpen(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction) => {
    setProcessing(true);
    if (action.showProgress) {
      setProgress({
        total: selectedCount,
        completed: 0,
        failed: 0,
        errors: [],
      });
    }

    try {
      await onAction(action.id);
      onClearSelection();
    } catch (error: any) {
      logger.error('Bulk action error:', error);
      if (progress) {
        setProgress((prev) =>
          prev
            ? {
                ...prev,
                failed: prev.failed + 1,
                errors: [...prev.errors, error.message || 'Unknown error'],
              }
            : null
        );
      }
    } finally {
      setProcessing(false);
      setConfirmDialogOpen(false);
      setSelectedAction(null);
      // Clear progress after 3 seconds if no errors
      if (progress && progress.failed === 0) {
        setTimeout(() => setProgress(null), 3000);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedAction) {
      executeAction(selectedAction);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <Collapse in={selectedCount > 0}>
        <Box
          sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Toolbar sx={{ pl: 2, pr: 1 }}>
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {selectedCount} selected
                </Typography>
                {!isAllPagesSelected && totalCount && totalCount > selectedCount && onSelectAllPages && (
                  <Button size="small" onClick={onSelectAllPages}>
                    Select all {totalCount} items
                  </Button>
                )}
                {isAllPagesSelected && totalCount && (
                  <Chip label={`All ${totalCount} items selected`} size="small" color="primary" />
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              {children}

              {actions.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<IconChevronDown size={16} />}
                  onClick={handleMenuOpen}
                  disabled={processing}
                >
                  Actions
                </Button>
              )}

              <Tooltip title="Clear selection">
                <IconButton size="small" onClick={onClearSelection} disabled={processing}>
                  <IconX size={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>

          {/* Progress Bar */}
          {processing && progress && (
            <Box sx={{ px: 2, pb: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Processing {progress.completed} of {progress.total}...
                  </Typography>
                  {progress.failed > 0 && (
                    <Button size="small" color="error" onClick={() => setShowErrors(!showErrors)}>
                      {progress.failed} failed
                    </Button>
                  )}
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(progress.completed / progress.total) * 100}
                  color={progress.failed > 0 ? 'error' : 'primary'}
                />
              </Stack>

              {/* Errors */}
              <Collapse in={showErrors}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Errors occurred:
                  </Typography>
                  {progress.errors.map((error, idx) => (
                    <Typography key={idx} variant="caption" display="block">
                      • {error}
                    </Typography>
                  ))}
                </Alert>
              </Collapse>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {actions.map((action) => (
          <MenuItem key={action.id} onClick={() => handleActionClick(action)}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {action.icon}
              <Typography>{action.label}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => !processing && setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconAlertCircle size={24} />
            <span>{selectedAction?.confirmationTitle || 'Confirm Action'}</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will affect <strong>{selectedCount}</strong> item(s).
          </Alert>
          <Typography>
            {selectedAction?.confirmationMessage || 'Are you sure you want to perform this action?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={selectedAction?.color || 'primary'}
            onClick={handleConfirm}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Predefined common bulk actions
export const commonBulkActions = {
  delete: (customMessage?: string): BulkAction => ({
    id: 'delete',
    label: 'Delete',
    icon: <IconTrash size={18} />,
    color: 'error',
    requiresConfirmation: true,
    confirmationTitle: 'Delete Items',
    confirmationMessage: customMessage || 'Are you sure you want to delete the selected items? This action cannot be undone.',
    showProgress: true,
  }),
  export: (): BulkAction => ({
    id: 'export',
    label: 'Export',
    icon: <IconDownload size={18} />,
    color: 'primary',
  }),
  sendNotification: (): BulkAction => ({
    id: 'notification',
    label: 'Send Notification',
    icon: <IconBell size={18} />,
    color: 'info',
  }),
  assignCategory: (): BulkAction => ({
    id: 'assign-category',
    label: 'Assign Category',
    icon: <IconCategory size={18} />,
  }),
  changeStatus: (status: string): BulkAction => ({
    id: `status-${status}`,
    label: `Mark as ${status}`,
    icon: <IconCheck size={18} />,
  }),
};
