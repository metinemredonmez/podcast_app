import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  IconEye,
  IconRefresh,
  IconCheck,
  IconX,
  IconClock,
  IconSend,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { apiClient } from '../../api/client';
import { logger } from '../../utils/logger';

interface PushLog {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  targetType: string;
  targetIds: string[];
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  status: string;
  providerMsgId?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
}

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PENDING: 'warning',
  QUEUED: 'primary',
  SENT: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
};

const statusIcons: Record<string, React.ReactElement> = {
  PENDING: <IconClock size={14} />,
  QUEUED: <IconClock size={14} />,
  SENT: <IconCheck size={14} />,
  FAILED: <IconX size={14} />,
  CANCELLED: <IconX size={14} />,
};

const PushLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<PushLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        offset: (page * rowsPerPage).toString(),
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await apiClient.get<{ data: PushLog[]; total: number }>(
        `/push/logs?${params.toString()}`
      );

      setLogs(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      logger.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (log: PushLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const getDeliveryRate = (log: PushLog) => {
    if (log.totalRecipients === 0) return 0;
    return Math.round((log.successCount / log.totalRecipients) * 100);
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Push Notification Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View sent push notifications and their delivery status
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="QUEUED">Queued</MenuItem>
              <MenuItem value="SENT">Sent</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={fetchLogs}>
            <IconRefresh size={20} />
          </IconButton>
        </Stack>
      </Stack>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={5}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell align="center">Recipients</TableCell>
                      <TableCell align="center">Delivery</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Sent At</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                          <Typography variant="body2" color="text.secondary">
                            No push notifications found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                              {log.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                              {log.body}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.targetType}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {log.totalRecipients.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack alignItems="center" spacing={0.5}>
                              <Typography variant="body2" fontWeight={500}>
                                {getDeliveryRate(log)}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {log.successCount} / {log.totalRecipients}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={statusIcons[log.status]}
                              label={log.status}
                              size="small"
                              color={statusColors[log.status] || 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.sentAt
                                ? format(new Date(log.sentAt), 'dd MMM yyyy HH:mm')
                                : log.scheduledAt
                                ? `Scheduled: ${format(new Date(log.scheduledAt), 'dd MMM HH:mm')}`
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleViewDetail(log)}>
                                <IconEye size={18} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50, 100]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconSend size={24} />
            <span>Push Notification Details</span>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={3}>
              {/* Content */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Content
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {selectedLog.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedLog.body}
                </Typography>
              </Paper>

              {/* Stats */}
              <Stack direction="row" spacing={3}>
                <Box flex={1}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    icon={statusIcons[selectedLog.status]}
                    label={selectedLog.status}
                    color={statusColors[selectedLog.status] || 'default'}
                  />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Target Type
                  </Typography>
                  <Chip label={selectedLog.targetType} variant="outlined" />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Delivery Rate
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {getDeliveryRate(selectedLog)}%
                  </Typography>
                </Box>
              </Stack>

              {/* Delivery Stats */}
              <Stack direction="row" spacing={3}>
                <Box flex={1}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={600}>
                      {selectedLog.totalRecipients}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Recipients
                    </Typography>
                  </Paper>
                </Box>
                <Box flex={1}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'success.main' }}>
                    <Typography variant="h4" fontWeight={600} color="success.main">
                      {selectedLog.successCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Delivered
                    </Typography>
                  </Paper>
                </Box>
                <Box flex={1}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'error.main' }}>
                    <Typography variant="h4" fontWeight={600} color="error.main">
                      {selectedLog.failureCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Failed
                    </Typography>
                  </Paper>
                </Box>
              </Stack>

              {/* Target IDs */}
              {selectedLog.targetIds.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Target IDs ({selectedLog.targetIds.length})
                  </Typography>
                  <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {selectedLog.targetIds.slice(0, 20).map((id, i) => (
                        <Chip key={i} label={id} size="small" variant="outlined" />
                      ))}
                      {selectedLog.targetIds.length > 20 && (
                        <Chip label={`+${selectedLog.targetIds.length - 20} more`} size="small" />
                      )}
                    </Stack>
                  </Box>
                </Box>
              )}

              {/* Data Payload */}
              {selectedLog.data && Object.keys(selectedLog.data).length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Data Payload
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                      {JSON.stringify(selectedLog.data, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}

              {/* Error Message */}
              {selectedLog.errorMessage && (
                <Box>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Error Message
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.lighter', borderColor: 'error.main' }}>
                    <Typography variant="body2" color="error">
                      {selectedLog.errorMessage}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Timestamps */}
              <Stack direction="row" spacing={3}>
                <Box flex={1}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedLog.createdAt), 'dd MMM yyyy HH:mm:ss')}
                  </Typography>
                </Box>
                {selectedLog.sentAt && (
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Sent At
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedLog.sentAt), 'dd MMM yyyy HH:mm:ss')}
                    </Typography>
                  </Box>
                )}
                {selectedLog.scheduledAt && (
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Scheduled For
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedLog.scheduledAt), 'dd MMM yyyy HH:mm:ss')}
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* Provider Message ID */}
              {selectedLog.providerMsgId && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Provider Message ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedLog.providerMsgId}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PushLogsPage;
