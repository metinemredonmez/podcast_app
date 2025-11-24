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
  Rating,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  IconSearch,
  IconDotsVertical,
  IconTrash,
  IconEye,
  IconStar,
  IconEyeOff,
} from '@tabler/icons-react';
import { reviewService, Review } from '../../api/services/review.service';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActions, commonBulkActions } from '../../components/table';

const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Bulk selection
  const bulkSelection = useBulkSelection({
    currentPageIds: reviews.map((r) => r.id),
    totalCount: total,
  });

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewService.list({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        rating: ratingFilter ? parseInt(ratingFilter) : undefined,
        isPublic: visibilityFilter === 'public' ? true : visibilityFilter === 'hidden' ? false : undefined,
      });
      setReviews(response.data || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, rowsPerPage, search, ratingFilter, visibilityFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, review: Review) => {
    setAnchorEl(event.currentTarget);
    setSelectedReview(review);
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
    if (selectedReview) {
      try {
        await reviewService.delete(selectedReview.id);
        fetchReviews();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete review');
      }
    }
    setDeleteDialogOpen(false);
    setSelectedReview(null);
  };

  const handleToggleVisibility = async () => {
    if (selectedReview) {
      try {
        await reviewService.updateVisibility(selectedReview.id, !selectedReview.isPublic);
        fetchReviews();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update review visibility');
      }
    }
    handleMenuClose();
  };

  const handleBulkAction = async (actionId: string) => {
    const ids = Array.from(bulkSelection.selectedIds);

    if (actionId === 'delete') {
      try {
        await Promise.all(ids.map((id) => reviewService.delete(id)));
        fetchReviews();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete reviews');
      }
    } else if (actionId === 'hide') {
      try {
        await Promise.all(ids.map((id) => reviewService.updateVisibility(id, false)));
        fetchReviews();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to hide reviews');
      }
    } else if (actionId === 'show') {
      try {
        await Promise.all(ids.map((id) => reviewService.updateVisibility(id, true)));
        fetchReviews();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to show reviews');
      }
    }
  };

  const truncateContent = (content: string | undefined, maxLength: number = 100) => {
    if (!content) return '-';
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
          <IconStar size={28} />
          <Typography variant="h4" fontWeight={600}>
            Reviews
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Manage podcast reviews and ratings
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
          {/* Search & Filters */}
          <Stack direction="row" spacing={2} mb={3}>
            <TextField
              placeholder="Search reviews..."
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Rating</InputLabel>
              <Select
                value={ratingFilter}
                label="Rating"
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="5">5 Stars</MenuItem>
                <MenuItem value="4">4 Stars</MenuItem>
                <MenuItem value="3">3 Stars</MenuItem>
                <MenuItem value="2">2 Stars</MenuItem>
                <MenuItem value="1">1 Star</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={visibilityFilter}
                label="Visibility"
                onChange={(e) => {
                  setVisibilityFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="hidden">Hidden</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={bulkSelection.selectedCount}
            totalCount={total}
            isAllPagesSelected={bulkSelection.isAllPagesSelected}
            onClearSelection={bulkSelection.clearSelection}
            onSelectAllPages={bulkSelection.toggleSelectAllPages}
            actions={[
              { id: 'hide', label: 'Hide Reviews', icon: <IconEyeOff size={18} />, color: 'warning' },
              { id: 'show', label: 'Show Reviews', icon: <IconEye size={18} />, color: 'success' },
              commonBulkActions.delete('Are you sure you want to delete the selected reviews? This action cannot be undone.'),
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
                      <TableCell>Podcast</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Review</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Box py={4}>
                            <IconStar size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <Typography color="text.secondary">
                              No reviews found
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviews.map((review) => (
                        <TableRow key={review.id} hover selected={bulkSelection.isSelected(review.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={bulkSelection.isSelected(review.id)}
                              onChange={() => bulkSelection.toggleSelectItem(review.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar src={review.user.avatarUrl} sx={{ width: 36, height: 36 }}>
                                {review.user.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {review.user.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {review.user.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {review.podcast.coverImageUrl && (
                                <Avatar
                                  src={review.podcast.coverImageUrl}
                                  variant="rounded"
                                  sx={{ width: 32, height: 32 }}
                                />
                              )}
                              <Typography variant="body2" fontWeight={500}>
                                {review.podcast.title}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Rating value={review.rating} readOnly size="small" />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 250 }}>
                            {review.title && (
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                {review.title}
                              </Typography>
                            )}
                            <Tooltip title={review.content || ''}>
                              <Typography variant="body2" color="text.secondary">
                                {truncateContent(review.content, 80)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={review.isPublic ? 'Public' : 'Hidden'}
                              size="small"
                              color={review.isPublic ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(review.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, review)}
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
        <MenuItem onClick={handleToggleVisibility}>
          {selectedReview?.isPublic ? (
            <>
              <IconEyeOff size={18} style={{ marginRight: 8 }} />
              Hide Review
            </>
          ) : (
            <>
              <IconEye size={18} style={{ marginRight: 8 }} />
              Show Review
            </>
          )}
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
            <IconStar size={24} />
            <span>Review Details</span>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReview && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Author
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={selectedReview.user.avatarUrl}>
                    {selectedReview.user.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedReview.user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedReview.user.email}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Podcast
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  {selectedReview.podcast.coverImageUrl && (
                    <Avatar
                      src={selectedReview.podcast.coverImageUrl}
                      variant="rounded"
                      sx={{ width: 48, height: 48 }}
                    />
                  )}
                  <Typography variant="body1">
                    {selectedReview.podcast.title}
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Rating
                </Typography>
                <Rating value={selectedReview.rating} readOnly />
              </Box>

              {selectedReview.title && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Title
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedReview.title}
                  </Typography>
                </Box>
              )}

              {selectedReview.content && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Content
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedReview.content}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={selectedReview.isPublic ? 'Public' : 'Hidden'}
                  color={selectedReview.isPublic ? 'success' : 'default'}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Posted
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedReview.createdAt)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Helpful Votes
                </Typography>
                <Typography variant="body1">
                  {selectedReview._count?.helpfulVotes || 0} votes
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button
            color={selectedReview?.isPublic ? 'warning' : 'success'}
            onClick={() => {
              handleToggleVisibility();
              setViewDialogOpen(false);
            }}
          >
            {selectedReview?.isPublic ? 'Hide' : 'Show'}
          </Button>
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
        <DialogTitle>Delete Review</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to delete this review?
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

export default ReviewsPage;
