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
  Avatar,
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
  IconEye,
  IconFilter,
} from '@tabler/icons-react';
import { podcastService, Podcast } from '../../api/services/podcast.service';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActions, commonBulkActions } from '../../components/table';
import { ExportDialog, ExportColumn } from '../../components/export';
import { IconDownload } from '@tabler/icons-react';
import { useFilters, FilterDefinition } from '../../hooks/useFilters';
import { FilterSidebar, FilterChips } from '../../components/filters';

const PodcastsPage: React.FC = () => {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);

  // Bulk selection
  const bulkSelection = useBulkSelection({
    currentPageIds: podcasts.map((p) => p.id),
    totalCount: total,
  });

  // Export
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportData, setExportData] = useState<Podcast[]>([]);

  const exportColumns: ExportColumn<Podcast>[] = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'category', label: 'Category' },
    { key: 'episodeCount', label: 'Episodes' },
    { key: 'totalPlays', label: 'Total Plays' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
  ];

  // Filters
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);

  const filterDefinitions: FilterDefinition[] = [
    {
      key: 'category',
      label: 'Category',
      type: 'multiselect',
      options: [
        { value: 'technology', label: 'Technology' },
        { value: 'business', label: 'Business' },
        { value: 'education', label: 'Education' },
        { value: 'health', label: 'Health & Fitness' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'news', label: 'News & Politics' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      type: 'daterange',
    },
    {
      key: 'minEpisodes',
      label: 'Minimum Episodes',
      type: 'number',
      placeholder: 'e.g. 10',
    },
  ];

  const {
    filters,
    setFilter,
    removeFilter,
    resetFilters,
    activeFilterCount,
    savedFilters,
    saveCurrentFilters,
    loadSavedFilter,
    deleteSavedFilter,
  } = useFilters({
    definitions: filterDefinitions,
    storageKey: 'podcasts-filters',
  });

  const fetchPodcasts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await podcastService.list({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      });
      setPodcasts(response.data || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load podcasts');
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodcasts();
  }, [page, rowsPerPage, search]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, podcast: Podcast) => {
    setAnchorEl(event.currentTarget);
    setSelectedPodcast(podcast);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPodcast(null);
  };

  const handleEdit = () => {
    if (selectedPodcast) {
      navigate(`/podcasts/${selectedPodcast.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedPodcast) {
      try {
        await podcastService.delete(selectedPodcast.id);
        fetchPodcasts();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete podcast');
      }
    }
    handleMenuClose();
  };

  const handleBulkAction = async (actionId: string) => {
    const ids = Array.from(bulkSelection.selectedIds);

    if (actionId === 'delete') {
      // Delete selected podcasts
      await Promise.all(ids.map((id) => podcastService.delete(id)));
      fetchPodcasts();
    } else if (actionId === 'export') {
      // Export selected podcasts
      const selectedPodcasts = podcasts.filter((p) => ids.includes(p.id));
      setExportData(selectedPodcasts);
      setExportDialogOpen(true);
    } else if (actionId.startsWith('status-')) {
      const status = actionId.replace('status-', '');
      // Update status for selected podcasts (implement status update)
      console.log('Updating status to:', status, 'for:', ids);
    }
  };

  const handleExportAll = () => {
    setExportData(podcasts);
    setExportDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
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
            Podcasts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all podcasts in the platform
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<IconFilter size={20} />} onClick={() => setFilterSidebarOpen(true)}>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
          <Button variant="outlined" startIcon={<IconDownload size={20} />} onClick={handleExportAll}>
            Export
          </Button>
          <Button variant="contained" startIcon={<IconPlus size={20} />} onClick={() => navigate('/podcasts/new')}>
            Add Podcast
          </Button>
        </Stack>
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
              placeholder="Search podcasts..."
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

          {/* Filter Chips */}
          <FilterChips
            filters={filters}
            definitions={filterDefinitions}
            onRemoveFilter={removeFilter}
            onClearAll={resetFilters}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={bulkSelection.selectedCount}
            totalCount={total}
            isAllPagesSelected={bulkSelection.isAllPagesSelected}
            onClearSelection={bulkSelection.clearSelection}
            onSelectAllPages={bulkSelection.toggleSelectAllPages}
            actions={[
              commonBulkActions.delete('Are you sure you want to delete the selected podcasts?'),
              commonBulkActions.export(),
              commonBulkActions.changeStatus('published'),
              commonBulkActions.changeStatus('draft'),
              commonBulkActions.changeStatus('archived'),
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
                      <TableCell>Podcast</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Episodes</TableCell>
                      <TableCell>Plays</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {podcasts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary" py={4}>
                            No podcasts found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      podcasts.map((podcast) => (
                        <TableRow key={podcast.id} hover selected={bulkSelection.isSelected(podcast.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={bulkSelection.isSelected(podcast.id)}
                              onChange={() => bulkSelection.toggleSelectItem(podcast.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar
                                src={podcast.coverImage}
                                variant="rounded"
                                sx={{ width: 48, height: 48 }}
                              >
                                {podcast.title.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {podcast.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  by {podcast.author}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>{podcast.category}</TableCell>
                          <TableCell>{podcast.episodeCount}</TableCell>
                          <TableCell>{podcast.totalPlays?.toLocaleString() || 0}</TableCell>
                          <TableCell>
                            <Chip
                              label={podcast.status}
                              size="small"
                              color={getStatusColor(podcast.status) as any}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, podcast)}
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
        <MenuItem onClick={() => { navigate(`/podcasts/${selectedPodcast?.id}`); handleMenuClose(); }}>
          <IconEye size={18} style={{ marginRight: 8 }} />
          View
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <IconEdit size={18} style={{ marginRight: 8 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <IconTrash size={18} style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        data={exportData}
        filename="podcasts"
        title="Podcasts Export"
        columns={exportColumns}
      />

      {/* Filter Sidebar */}
      <FilterSidebar
        open={filterSidebarOpen}
        onClose={() => setFilterSidebarOpen(false)}
        filters={filters}
        definitions={filterDefinitions}
        onFilterChange={setFilter}
        onReset={resetFilters}
        savedFilters={savedFilters}
        onSaveFilter={saveCurrentFilters}
        onLoadFilter={loadSavedFilter}
        onDeleteFilter={deleteSavedFilter}
      />
    </Box>
  );
};

export default PodcastsPage;
