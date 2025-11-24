import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Paper,
  Grid,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  IconSearch,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconFlag,
  IconTrash,
  IconArrowUp,
  IconRefresh,
  IconMicrophone,
  IconUser,
  IconMessage,
  IconEye,
  IconAlertTriangle,
  IconClock,
  IconCalendarStats,
  IconFilter,
} from '@tabler/icons-react';
import moderationService, {
  ModerationItem,
  ModerationStatus,
  ModerationStats,
  EntityType,
  ModerationQueueParams,
  ReportHistoryItem,
} from '../../api/services/moderation.service';

const getStatusColor = (status: ModerationStatus) => {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'error';
    case 'ESCALATED': return 'info';
    default: return 'default';
  }
};

const getEntityIcon = (entityType: string) => {
  switch (entityType.toLowerCase()) {
    case 'episode':
    case 'podcast': return <IconMicrophone size={18} />;
    case 'user': return <IconUser size={18} />;
    case 'comment': return <IconMessage size={18} />;
    default: return <IconFlag size={18} />;
  }
};

const getPriorityLabel = (priority: number) => {
  if (priority >= 8) return { label: 'Critical', color: 'error' as const };
  if (priority >= 5) return { label: 'High', color: 'warning' as const };
  if (priority >= 3) return { label: 'Medium', color: 'info' as const };
  return { label: 'Low', color: 'default' as const };
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

type SortField = 'date' | 'priority';
type SortOrder = 'asc' | 'desc';

const ModerationPage: React.FC = () => {
  // Data state
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort state
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityType | ''>('');
  const [sortBy, setSortBy] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Menu & selection state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);

  // Dialog states
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'escalate' | 'delete' | 'warn' | null;
  }>({ open: false, action: null });
  const [detailDialog, setDetailDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Get status filter from tab
  const getStatusFilter = (): ModerationStatus | undefined => {
    switch (tabValue) {
      case 1: return 'PENDING';
      case 2: return 'ESCALATED';
      case 3: return 'APPROVED';
      case 4: return 'REJECTED';
      default: return undefined;
    }
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ModerationQueueParams = {
        status: getStatusFilter(),
        type: typeFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
      };

      const [queueData, statsData] = await Promise.all([
        moderationService.getQueuePaginated(params),
        moderationService.getStats(),
      ]);

      setItems(queueData.data);
      setTotal(queueData.total);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load moderation data');
      // Demo data
      setItems([
        {
          id: '1',
          entityType: 'Episode',
          entityId: 'ep-123',
          reason: 'Inappropriate content reported by multiple users. Contains explicit language without proper warning.',
          status: 'PENDING',
          priority: 7,
          reportCount: 5,
          createdAt: '2024-01-20T10:00:00Z',
          updatedAt: '2024-01-20T10:00:00Z',
          reportedUser: { id: '1', name: 'John Doe', email: 'john@example.com' },
          contentPreview: 'Episode Title: Tech Talk #45 - The Future of AI...',
        },
        {
          id: '2',
          entityType: 'Comment',
          entityId: 'cmt-456',
          reason: 'Spam content - promotional links',
          status: 'PENDING',
          priority: 3,
          reportCount: 2,
          createdAt: '2024-01-19T15:30:00Z',
          updatedAt: '2024-01-19T15:30:00Z',
          reportedUser: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
          contentPreview: 'Check out this amazing deal at www.spam-link.com...',
        },
        {
          id: '3',
          entityType: 'Podcast',
          entityId: 'pod-789',
          reason: 'Copyright violation claim - using copyrighted music',
          status: 'ESCALATED',
          priority: 9,
          reportCount: 1,
          createdAt: '2024-01-18T09:00:00Z',
          updatedAt: '2024-01-19T12:00:00Z',
          reportedUser: { id: '3', name: 'Bob Wilson', email: 'bob@example.com' },
          moderator: { id: '4', name: 'Admin User', email: 'admin@example.com' },
          notes: 'Needs legal review - potential DMCA issue',
          contentPreview: 'Podcast: Music Mix Daily - Featuring popular hits...',
        },
        {
          id: '4',
          entityType: 'User',
          entityId: 'usr-101',
          reason: 'Harassment and abusive behavior',
          status: 'PENDING',
          priority: 8,
          reportCount: 12,
          createdAt: '2024-01-20T08:00:00Z',
          updatedAt: '2024-01-20T08:00:00Z',
          reportedUser: { id: '5', name: 'Toxic User', email: 'toxic@example.com' },
          contentPreview: 'User profile with multiple violations...',
        },
      ]);
      setTotal(4);
      setStats({
        pending: 5,
        approved: 23,
        rejected: 8,
        escalated: 2,
        total: 38,
        resolvedToday: 7,
        avgResolutionTime: 45,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tabValue, typeFilter, sortBy, sortOrder, page, rowsPerPage]);

  // Filter items by search (client-side)
  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.entityType.toLowerCase().includes(searchLower) ||
      item.entityId.toLowerCase().includes(searchLower) ||
      item.reason?.toLowerCase().includes(searchLower) ||
      item.reportedUser?.name.toLowerCase().includes(searchLower)
    );
  });

  // Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: ModerationItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleOpenActionDialog = (action: 'approve' | 'reject' | 'escalate' | 'delete' | 'warn') => {
    setActionDialog({ open: true, action });
    setNotes('');
    setWarnReason('');
    handleMenuClose();
  };

  const handleCloseActionDialog = () => {
    setActionDialog({ open: false, action: null });
    setNotes('');
    setWarnReason('');
  };

  const handleOpenDetailDialog = async () => {
    setDetailDialog(true);
    handleMenuClose();

    if (selectedItem) {
      setLoadingHistory(true);
      try {
        const history = await moderationService.getReportHistory(
          selectedItem.entityType,
          selectedItem.entityId
        );
        setReportHistory(history);
      } catch {
        // Demo history
        setReportHistory([
          {
            id: '1',
            reason: selectedItem.reason || 'No reason',
            reportedBy: selectedItem.reportedBy || 'anonymous',
            reporterName: selectedItem.reportedUser?.name || 'Anonymous',
            createdAt: selectedItem.createdAt,
          },
        ]);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  const handleCloseDetailDialog = () => {
    setDetailDialog(false);
    setReportHistory([]);
  };

  const handleAction = async () => {
    if (!selectedItem || !actionDialog.action) return;

    setProcessing(true);
    try {
      switch (actionDialog.action) {
        case 'approve':
          await moderationService.moderate(selectedItem.id, { action: 'APPROVED', notes });
          setSnackbar({ open: true, message: 'Content approved successfully', severity: 'success' });
          break;
        case 'reject':
          await moderationService.moderate(selectedItem.id, { action: 'REJECTED', notes });
          setSnackbar({ open: true, message: 'Content rejected and removed', severity: 'success' });
          break;
        case 'escalate':
          await moderationService.escalate(selectedItem.id, { notes });
          setSnackbar({ open: true, message: 'Item escalated to admin', severity: 'success' });
          break;
        case 'warn':
          if (selectedItem.reportedUser) {
            await moderationService.warnUser({
              userId: selectedItem.reportedUser.id,
              reason: warnReason,
              moderationItemId: selectedItem.id,
            });
            setSnackbar({ open: true, message: 'User warned successfully', severity: 'success' });
          }
          break;
        case 'delete':
          await moderationService.delete(selectedItem.id);
          setSnackbar({ open: true, message: 'Item removed from queue', severity: 'success' });
          break;
      }
      handleCloseActionDialog();
      handleCloseDetailDialog();
      setSelectedItem(null);
      fetchData();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Action failed',
        severity: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getActionDialogContent = () => {
    switch (actionDialog.action) {
      case 'approve':
        return { title: 'Approve Content', description: 'Dismiss report and keep the content.', buttonText: 'Approve', buttonColor: 'success' as const };
      case 'reject':
        return { title: 'Remove Content', description: 'Remove the content and mark report as resolved.', buttonText: 'Remove', buttonColor: 'error' as const };
      case 'escalate':
        return { title: 'Escalate to Admin', description: 'Escalate for senior review.', buttonText: 'Escalate', buttonColor: 'warning' as const };
      case 'warn':
        return { title: 'Warn User', description: 'Send a warning to the content owner.', buttonText: 'Send Warning', buttonColor: 'warning' as const };
      case 'delete':
        return { title: 'Remove from Queue', description: 'Remove without action.', buttonText: 'Remove', buttonColor: 'error' as const };
      default:
        return { title: '', description: '', buttonText: '', buttonColor: 'primary' as const };
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Moderation Queue</Typography>
          <Typography variant="body2" color="text.secondary">Review and moderate reported content</Typography>
        </Box>
        <Button variant="outlined" startIcon={<IconRefresh size={18} />} onClick={fetchData} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {/* Enhanced Stats Cards */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.lighter' }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">{stats.pending}</Typography>
              <Typography variant="body2" color="text.secondary">Pending</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.lighter' }}>
              <Typography variant="h4" fontWeight={700} color="info.main">{stats.escalated}</Typography>
              <Typography variant="body2" color="text.secondary">Escalated</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">{stats.approved}</Typography>
              <Typography variant="body2" color="text.secondary">Approved</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.lighter' }}>
              <Typography variant="h4" fontWeight={700} color="error.main">{stats.rejected}</Typography>
              <Typography variant="body2" color="text.secondary">Rejected</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                <IconCalendarStats size={20} color="#666" />
                <Typography variant="h4" fontWeight={700}>{stats.resolvedToday || 0}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">Resolved Today</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                <IconClock size={20} color="#666" />
                <Typography variant="h4" fontWeight={700}>
                  {stats.avgResolutionTime ? formatDuration(stats.avgResolutionTime) : '-'}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">Avg Resolution</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Main Content */}
      <Card>
        <CardContent>
          {/* Tabs */}
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tab label="All" />
            <Tab label={<Badge badgeContent={stats?.pending} color="warning" max={99}><Box sx={{ pr: 2 }}>Pending</Box></Badge>} />
            <Tab label={<Badge badgeContent={stats?.escalated} color="info" max={99}><Box sx={{ pr: 2 }}>Escalated</Box></Badge>} />
            <Tab label="Approved" />
            <Tab label="Rejected" />
          </Tabs>

          {/* Filters Row */}
          <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
            <TextField
              placeholder="Search..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 250 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment>,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value as EntityType | '')}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="podcast">Podcast</MenuItem>
                <MenuItem value="episode">Episode</MenuItem>
                <MenuItem value="comment">Comment</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {error && <Alert severity="warning" sx={{ mb: 2 }}>{error} - Showing demo data</Alert>}

          {/* Table */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : filteredItems.length === 0 ? (
            <Box textAlign="center" py={4}>
              <IconCheck size={48} color="#4caf50" />
              <Typography variant="h6" mt={2}>No items to review</Typography>
              <Typography variant="body2" color="text.secondary">All caught up!</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Content</TableCell>
                      <TableCell>Reporter</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'priority'}
                          direction={sortBy === 'priority' ? sortOrder : 'asc'}
                          onClick={() => handleSort('priority')}
                        >
                          Priority
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'date'}
                          direction={sortBy === 'date' ? sortOrder : 'asc'}
                          onClick={() => handleSort('date')}
                        >
                          Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const priorityInfo = getPriorityLabel(item.priority);
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {getEntityIcon(item.entityType)}
                              <Typography variant="subtitle2">{item.entityType}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.entityId}
                            </Typography>
                            {item.reportCount && item.reportCount > 1 && (
                              <Chip label={`${item.reportCount} reports`} size="small" color="error" variant="outlined" sx={{ mt: 0.5 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.reportedUser?.name || 'Anonymous'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={item.reason || ''}>
                              <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.reason || '-'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip label={priorityInfo.label} size="small" color={priorityInfo.color} variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip label={item.status} size="small" color={getStatusColor(item.status)} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, item)}>
                              <IconDotsVertical size={18} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleOpenDetailDialog}>
          <IconEye size={18} style={{ marginRight: 8 }} /> View Details
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOpenActionDialog('approve')} disabled={selectedItem?.status !== 'PENDING'}>
          <IconCheck size={18} style={{ marginRight: 8 }} color="#4caf50" /> Approve
        </MenuItem>
        <MenuItem onClick={() => handleOpenActionDialog('reject')} disabled={selectedItem?.status !== 'PENDING'}>
          <IconX size={18} style={{ marginRight: 8 }} color="#f44336" /> Remove Content
        </MenuItem>
        <MenuItem onClick={() => handleOpenActionDialog('warn')} disabled={!selectedItem?.reportedUser}>
          <IconAlertTriangle size={18} style={{ marginRight: 8 }} color="#ff9800" /> Warn User
        </MenuItem>
        <MenuItem onClick={() => handleOpenActionDialog('escalate')} disabled={selectedItem?.status === 'ESCALATED'}>
          <IconArrowUp size={18} style={{ marginRight: 8 }} color="#2196f3" /> Escalate
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOpenActionDialog('delete')} sx={{ color: 'error.main' }}>
          <IconTrash size={18} style={{ marginRight: 8 }} /> Remove from Queue
        </MenuItem>
      </Menu>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={handleCloseActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{getActionDialogContent().title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{getActionDialogContent().description}</DialogContentText>
          {selectedItem && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                {getEntityIcon(selectedItem.entityType)}
                <Typography variant="subtitle2">{selectedItem.entityType}: {selectedItem.entityId}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">{selectedItem.reason}</Typography>
            </Paper>
          )}
          {actionDialog.action === 'warn' ? (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Warning Message"
              placeholder="Explain why the user is being warned..."
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              required
            />
          ) : (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optional)"
              placeholder="Add notes about this decision..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseActionDialog} disabled={processing}>Cancel</Button>
          <Button
            variant="contained"
            color={getActionDialogContent().buttonColor}
            onClick={handleAction}
            disabled={processing || (actionDialog.action === 'warn' && !warnReason)}
            startIcon={processing ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {processing ? 'Processing...' : getActionDialogContent().buttonText}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailDialog} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            {selectedItem && getEntityIcon(selectedItem.entityType)}
            <Typography variant="h6">Report Details</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Grid container spacing={3}>
              {/* Content Preview */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Content Preview</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">
                    {selectedItem.contentPreview || `${selectedItem.entityType} ID: ${selectedItem.entityId}`}
                  </Typography>
                </Paper>
              </Grid>

              {/* Report Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Report Information</Typography>
                <Stack spacing={1}>
                  <Box><Typography variant="caption" color="text.secondary">Status</Typography>
                    <Chip label={selectedItem.status} size="small" color={getStatusColor(selectedItem.status)} sx={{ ml: 1 }} />
                  </Box>
                  <Box><Typography variant="caption" color="text.secondary">Priority</Typography>
                    <Chip label={getPriorityLabel(selectedItem.priority).label} size="small" color={getPriorityLabel(selectedItem.priority).color} variant="outlined" sx={{ ml: 1 }} />
                  </Box>
                  <Box><Typography variant="caption" color="text.secondary">Reported:</Typography>
                    <Typography variant="body2">{new Date(selectedItem.createdAt).toLocaleString()}</Typography>
                  </Box>
                  <Box><Typography variant="caption" color="text.secondary">Reason:</Typography>
                    <Typography variant="body2">{selectedItem.reason || 'No reason provided'}</Typography>
                  </Box>
                </Stack>
              </Grid>

              {/* Reporter Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Reporter</Typography>
                {selectedItem.reportedUser ? (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar>{selectedItem.reportedUser.name.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{selectedItem.reportedUser.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{selectedItem.reportedUser.email}</Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">Anonymous report</Typography>
                )}
              </Grid>

              {/* Report History */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Report History {selectedItem.reportCount && `(${selectedItem.reportCount} reports)`}
                </Typography>
                {loadingHistory ? (
                  <CircularProgress size={24} />
                ) : (
                  <List dense>
                    {reportHistory.map((report, index) => (
                      <ListItem key={report.id || index} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32 }}>{report.reporterName.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={report.reason}
                          secondary={`${report.reporterName} • ${new Date(report.createdAt).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Grid>

              {/* Moderator Notes */}
              {selectedItem.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Moderator Notes</Typography>
                  <Alert severity="info">{selectedItem.notes}</Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDetailDialog}>Close</Button>
          <Button variant="contained" color="success" onClick={() => handleOpenActionDialog('approve')} disabled={selectedItem?.status !== 'PENDING'}>
            Approve
          </Button>
          <Button variant="contained" color="error" onClick={() => handleOpenActionDialog('reject')} disabled={selectedItem?.status !== 'PENDING'}>
            Remove
          </Button>
          <Button variant="contained" color="warning" onClick={() => handleOpenActionDialog('warn')} disabled={!selectedItem?.reportedUser}>
            Warn User
          </Button>
          <Button variant="outlined" onClick={() => handleOpenActionDialog('escalate')} disabled={selectedItem?.status === 'ESCALATED'}>
            Escalate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModerationPage;
