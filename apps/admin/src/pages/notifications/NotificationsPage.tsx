import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconEye,
  IconTrash,
  IconX,
  IconCheck,
  IconClock,
  IconSend,
  IconMail,
  IconBell,
  IconDeviceMobile,
} from '@tabler/icons-react';
import {
  notificationService,
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationStats,
} from '../../api/services/notification.service';

const getTypeIcon = (type: NotificationType): React.ReactElement => {
  switch (type) {
    case 'push':
      return <IconDeviceMobile size={14} />;
    case 'email':
      return <IconMail size={14} />;
    case 'in-app':
      return <IconBell size={14} />;
    case 'all':
      return <IconSend size={14} />;
    default:
      return <IconBell size={14} />;
  }
};

const typeColors: Record<NotificationType, 'primary' | 'secondary' | 'info' | 'success'> = {
  push: 'primary',
  email: 'secondary',
  'in-app': 'info',
  all: 'success',
};

const statusColors: Record<NotificationStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  draft: 'default',
  scheduled: 'warning',
  sending: 'info',
  sent: 'success',
  failed: 'error',
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationService.getNotifications({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setNotifications(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, rowsPerPage, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchNotifications();
      } else {
        setPage(0);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleViewDetails = async (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailDialogOpen(true);
    setStatsLoading(true);
    try {
      const stats = await notificationService.getStats(notification.id);
      setNotificationStats(stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await notificationService.deleteNotification(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete notification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelScheduled = async (id: string) => {
    setActionLoading(true);
    try {
      await notificationService.cancelScheduled(id);
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel notification');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and send notifications to users
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={() => navigate('/notifications/send')}
        >
          Send Notification
        </Button>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="push">Push</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="in-app">In-App</MenuItem>
                <MenuItem value="all">All Channels</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="sending">Sending</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Delivery Rate</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No notifications found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification) => (
                    <TableRow key={notification.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          By {notification.createdBy}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTypeIcon(notification.type)}
                          label={notification.type.toUpperCase()}
                          size="small"
                          color={typeColors[notification.type]}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {notification.recipientCount.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notification.recipientType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={notification.status} size="small" color={statusColors[notification.status]} />
                      </TableCell>
                      <TableCell>
                        {notification.status === 'sent' ? (
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {notification.deliveryRate.toFixed(1)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={notification.deliveryRate}
                              sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                              color={notification.deliveryRate > 90 ? 'success' : notification.deliveryRate > 70 ? 'warning' : 'error'}
                            />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {notification.sentAt ? (
                          <Typography variant="caption">
                            {new Date(notification.sentAt).toLocaleString()}
                          </Typography>
                        ) : notification.scheduledAt ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconClock size={14} />
                            <Typography variant="caption">
                              {new Date(notification.scheduledAt).toLocaleString()}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Not sent
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(notification)}>
                            <IconEye size={18} />
                          </IconButton>
                        </Tooltip>
                        {notification.status === 'scheduled' && (
                          <Tooltip title="Cancel">
                            <IconButton size="small" onClick={() => handleCancelScheduled(notification.id)}>
                              <IconX size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {notification.status === 'draft' && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeleteId(notification.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <IconTrash size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
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
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Details</DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Title
                </Typography>
                <Typography variant="body1">{selectedNotification.title}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Body
                </Typography>
                <Typography variant="body2">{selectedNotification.body}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Delivery Statistics
                </Typography>
                {statsLoading ? (
                  <CircularProgress size={24} />
                ) : notificationStats ? (
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Sent:</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {notificationStats.sentCount.toLocaleString()}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Delivered:</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {notificationStats.deliveredCount.toLocaleString()} ({notificationStats.deliveryRate.toFixed(1)}%)
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Opened:</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {notificationStats.openedCount.toLocaleString()} ({notificationStats.openRate.toFixed(1)}%)
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Clicked:</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {notificationStats.clickedCount.toLocaleString()} ({notificationStats.clickRate.toFixed(1)}%)
                      </Typography>
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No stats available
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this notification? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage;
