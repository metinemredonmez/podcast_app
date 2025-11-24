import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Checkbox,
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconClock,
} from '@tabler/icons-react';
import { episodeService, Episode } from '../../api/services/episode.service';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActions, commonBulkActions } from '../../components/table';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const EpisodesPage: React.FC = () => {
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  // Bulk selection
  const bulkSelection = useBulkSelection({
    currentPageIds: episodes.map((e) => e.id),
    totalCount: total,
  });

  const fetchEpisodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await episodeService.list({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      });
      setEpisodes(response.data || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load episodes');
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEpisodes();
  }, [page, rowsPerPage, search]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, episode: Episode) => {
    setAnchorEl(event.currentTarget);
    setSelectedEpisode(episode);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEpisode(null);
  };

  const handleDelete = async () => {
    if (selectedEpisode) {
      try {
        await episodeService.delete(selectedEpisode.id);
        fetchEpisodes();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete episode');
      }
    }
    handleMenuClose();
  };

  const handleBulkAction = async (actionId: string) => {
    const ids = Array.from(bulkSelection.selectedIds);

    if (actionId === 'delete') {
      await Promise.all(ids.map((id) => episodeService.delete(id)));
      fetchEpisodes();
    } else if (actionId === 'export') {
      console.log('Exporting episodes:', ids);
    } else if (actionId.startsWith('status-')) {
      const status = actionId.replace('status-', '');
      console.log('Updating status to:', status, 'for:', ids);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'scheduled':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Episodes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all podcast episodes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<IconPlus size={20} />}
          onClick={() => navigate('/episodes/new')}
        >
          Add Episode
        </Button>
      </Stack>

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
              placeholder="Search episodes..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              commonBulkActions.delete('Are you sure you want to delete the selected episodes?'),
              commonBulkActions.export(),
              commonBulkActions.changeStatus('published'),
              commonBulkActions.changeStatus('draft'),
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
                      <TableCell>Episode</TableCell>
                      <TableCell>Podcast</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Plays</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {episodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary" py={4}>
                            No episodes found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      episodes.map((episode) => (
                        <TableRow key={episode.id} hover selected={bulkSelection.isSelected(episode.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={bulkSelection.isSelected(episode.id)}
                              onChange={() => bulkSelection.toggleSelectItem(episode.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 1,
                                  bgcolor: 'primary.light',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <IconPlayerPlay size={20} color="#5D87FF" />
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {episode.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Episode #{episode.episodeNumber}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {episode.podcast?.title || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <IconClock size={16} />
                              <Typography variant="body2">
                                {formatDuration(episode.duration)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Chip
                              label={episode.isPublished ? 'Published' : 'Draft'}
                              size="small"
                              color={episode.isPublished ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, episode)}
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
        <MenuItem onClick={() => { navigate(`/episodes/${selectedEpisode?.id}`); handleMenuClose(); }}>
          <IconEdit size={18} style={{ marginRight: 8 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <IconTrash size={18} style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EpisodesPage;
