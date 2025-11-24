import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
} from '@mui/material';
import {
  IconSearch,
  IconDotsVertical,
  IconTrash,
  IconEye,
  IconMessage,
  IconMessageCircle,
} from '@tabler/icons-react';
import { commentService, Comment } from '../../api/services/comment.service';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActions, commonBulkActions } from '../../components/table';

const CommentsPage: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Bulk selection
  const bulkSelection = useBulkSelection({
    currentPageIds: comments.map((c) => c.id),
    totalCount: total,
  });

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await commentService.list({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      });
      setComments(response.data || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [page, rowsPerPage, search]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, comment: Comment) => {
    setAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedComment) {
      try {
        await commentService.delete(selectedComment.id);
        fetchComments();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete comment');
      }
    }
    setDeleteDialogOpen(false);
    setSelectedComment(null);
  };

  const handleBulkAction = async (actionId: string) => {
    const ids = Array.from(bulkSelection.selectedIds);

    if (actionId === 'delete') {
      try {
        await Promise.all(ids.map((id) => commentService.delete(id)));
        fetchComments();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete comments');
      }
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      {/* Page Header */}
      <Box mb={3}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <IconMessage size={28} />
          <Typography variant="h4" fontWeight={600}>
            Comments
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Manage and moderate user comments
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardContent>
          {/* Search */}
          <Stack direction="row" spacing={2} mb={3}>
            <TextField
              placeholder="Search comments..."
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={bulkSelection.selectedCount}
            totalCount={total}
            isAllPagesSelected={bulkSelection.isAllPagesSelected}
            onClearSelection={bulkSelection.clearSelection}
            onSelectAllPages={bulkSelection.toggleSelectAllPages}
            actions={[
              commonBulkActions.delete('Are you sure you want to delete the selected comments? This action cannot be undone.'),
            ]}
            onAction={handleBulkAction}
          />

          {/* Table */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={bulkSelection.isAllSelected}
                          indeterminate={bulkSelection.selectedCount > 0 && !bulkSelection.isAllSelected}
                          onChange={bulkSelection.toggleSelectAll}
                        />
                      </TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Comment</TableCell>
                      <TableCell>Episode / Podcast</TableCell>
                      <TableCell>Replies</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box py={4}>
                            <IconMessageCircle size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <Typography color="text.secondary">
                              No comments found
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      comments.map((comment) => (
                        <TableRow key={comment.id} hover selected={bulkSelection.isSelected(comment.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={bulkSelection.isSelected(comment.id)}
                              onChange={() => bulkSelection.toggleSelectItem(comment.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar src={comment.user.avatarUrl} sx={{ width: 36, height: 36 }}>
                                {comment.user.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {comment.user.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {comment.user.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Tooltip title={comment.content}>
                              <Typography variant="body2">
                                {truncateContent(comment.content)}
                              </Typography>
                            </Tooltip>
                            {comment.isEdited && (
                              <Chip label="Edited" size="small" variant="outlined" sx={{ mt: 0.5 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {comment.episode?.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {comment.episode?.podcast?.title}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={comment._count?.replies || 0}
                              size="small"
                              variant="outlined"
                              icon={<IconMessageCircle size={14} />}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(comment.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, comment)}
                            >
                              <IconDotsVertical size={18} />
                            </IconButton>
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
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleView}>
          <IconEye size={18} style={{ marginRight: 8 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <IconTrash size={18} style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconMessage size={24} />
            <span>Comment Details</span>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedComment && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Author
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={selectedComment.user.avatarUrl}>
                    {selectedComment.user.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedComment.user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedComment.user.email}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Episode
                </Typography>
                <Typography variant="body1">
                  {selectedComment.episode?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedComment.episode?.podcast?.title}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Content
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedComment.content}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Posted
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedComment.createdAt)}
                </Typography>
                {selectedComment.isEdited && (
                  <Chip label="Edited" size="small" sx={{ mt: 1 }} />
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Replies
                </Typography>
                <Typography variant="body1">
                  {selectedComment._count?.replies || 0} replies
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button
            color="error"
            onClick={() => {
              setViewDialogOpen(false);
              setDeleteDialogOpen(true);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Comment</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to delete this comment? All replies will also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommentsPage;
