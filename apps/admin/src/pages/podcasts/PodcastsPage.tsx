import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Paper,
  Slider,
  Collapse,
  Dialog,
  DialogContent,
  keyframes,
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconFilter,
  IconRefresh,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconX,
  IconVideo,
} from '@tabler/icons-react';
import { podcastService, Podcast } from '../../api/services/podcast.service';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { BulkActions, commonBulkActions } from '../../components/table';
import { ExportDialog, ExportColumn } from '../../components/export';
import { IconDownload } from '@tabler/icons-react';
import { useFilters, FilterDefinition } from '../../hooks/useFilters';
import { FilterSidebar, FilterChips } from '../../components/filters';
import { logger } from '../../utils/logger';

// Audio wave animation keyframes
const soundWave = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`;

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

  // Player Modal state
  const [playingPodcast, setPlayingPodcast] = useState<Podcast | null>(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      // Backend returns cursor pagination, so we estimate total
      setTotal(response.hasMore ? (page + 2) * rowsPerPage : (page * rowsPerPage) + (response.data?.length || 0));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Podcasts yüklenemedi');
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
      // TODO: Implement bulk status update
      logger.info('Updating status to:', status, 'for:', ids);
    }
  };

  const handleExportAll = () => {
    setExportData(podcasts);
    setExportDialogOpen(true);
  };

  // Player functions
  const handlePlayPodcast = (podcast: Podcast) => {
    const mediaUrl = podcast.audioUrl || podcast.videoUrl;
    if (!mediaUrl) {
      setError('Bu podcast için medya dosyası yok');
      return;
    }

    setPlayingPodcast(podcast);
    setPlayerModalOpen(true);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const getMediaRef = () => {
    const isVideo = playingPodcast?.videoUrl && !playingPodcast?.audioUrl;
    return isVideo ? videoRef.current : audioRef.current;
  };

  const togglePlay = () => {
    const media = getMediaRef();
    if (!media) return;
    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const media = getMediaRef();
    if (media) {
      setCurrentTime(media.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const media = getMediaRef();
    if (media) {
      setDuration(media.duration);
      media.play().catch(() => {
        setError('Medya oynatılamadı');
      });
    }
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    const time = value as number;
    const media = getMediaRef();
    if (media) {
      media.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const vol = value as number;
    setVolume(vol);
    const media = getMediaRef();
    if (media) {
      media.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const media = getMediaRef();
    if (media) {
      media.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const closePlayerModal = () => {
    const media = getMediaRef();
    if (media) {
      media.pause();
    }
    setPlayerModalOpen(false);
    setPlayingPodcast(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isVideoPlaying = playingPodcast?.videoUrl && !playingPodcast?.audioUrl;

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
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={fetchPodcasts} disabled={loading}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
            <TextField
              placeholder="Search podcasts..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 300 } }}
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
                              <Box
                                sx={{
                                  position: 'relative',
                                  cursor: (podcast.audioUrl || podcast.videoUrl) ? 'pointer' : 'default',
                                  '&:hover .play-overlay': {
                                    opacity: 1,
                                  },
                                }}
                                onClick={() => handlePlayPodcast(podcast)}
                              >
                                <Avatar
                                  src={podcast.coverImageUrl || '/images/default-podcast-cover.svg'}
                                  variant="rounded"
                                  sx={{ width: 48, height: 48 }}
                                >
                                  {podcast.title.charAt(0)}
                                </Avatar>
                                {(podcast.audioUrl || podcast.videoUrl) && (
                                  <Box
                                    className="play-overlay"
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: 48,
                                      height: 48,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'rgba(0,0,0,0.5)',
                                      borderRadius: 1,
                                      opacity: playingPodcast?.id === podcast.id ? 1 : 0,
                                      transition: 'opacity 0.2s',
                                    }}
                                  >
                                    {playingPodcast?.id === podcast.id && isPlaying ? (
                                      <IconPlayerPause size={24} color="white" />
                                    ) : (
                                      <IconPlayerPlay size={24} color="white" />
                                    )}
                                  </Box>
                                )}
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {podcast.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  by {podcast.owner?.name || 'Unknown'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>{podcast.categories?.[0]?.name || '-'}</TableCell>
                          <TableCell>{podcast._count?.episodes || 0}</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>
                            <Chip
                              label={podcast.isPublished ? 'Yayında' : 'Taslak'}
                              size="small"
                              color={podcast.isPublished ? 'success' : 'default'}
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
        <MenuItem onClick={handleEdit}>
          <IconEdit size={18} style={{ marginRight: 8 }} />
          Düzenle
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <IconTrash size={18} style={{ marginRight: 8 }} />
          Sil
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

      {/* Player Modal */}
      <Dialog
        open={playerModalOpen}
        onClose={closePlayerModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Close Button */}
          <IconButton
            onClick={closePlayerModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <IconX size={20} color="white" />
          </IconButton>

          {/* Video Player */}
          {isVideoPlaying && playingPodcast?.videoUrl && (
            <Box sx={{ bgcolor: 'black' }}>
              <video
                ref={videoRef}
                src={playingPodcast.videoUrl}
                style={{ width: '100%', maxHeight: 400 }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            </Box>
          )}

          {/* Audio Player with Cover Art */}
          {!isVideoPlaying && playingPodcast && (
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                minHeight: 300,
                background: 'linear-gradient(180deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)',
              }}
            >
              {/* Hidden Audio Element */}
              <audio
                ref={audioRef}
                src={playingPodcast.audioUrl || undefined}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />

              {/* Cover Image with Sound Wave Animation */}
              <Box
                sx={{
                  position: 'relative',
                  width: 180,
                  height: 180,
                  mb: 3,
                }}
              >
                <Avatar
                  src={playingPodcast.coverImageUrl || '/images/default-podcast-cover.svg'}
                  variant="rounded"
                  sx={{
                    width: '100%',
                    height: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  {playingPodcast.title?.charAt(0)}
                </Avatar>

                {/* Sound Wave Animation Overlay */}
                {isPlaying && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 40,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: 0.5,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      borderRadius: '0 0 8px 8px',
                      p: 1,
                    }}
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 4,
                          height: 20,
                          bgcolor: 'primary.main',
                          borderRadius: 1,
                          animation: `${soundWave} 0.5s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              {/* Podcast Info */}
              <Typography variant="h6" fontWeight={600} textAlign="center">
                {playingPodcast.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {playingPodcast.owner?.name || 'Unknown'}
              </Typography>
            </Box>
          )}

          {/* Player Controls */}
          <Box sx={{ p: 3, bgcolor: 'background.default' }}>
            {/* Progress Slider */}
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Typography variant="caption" sx={{ minWidth: 40 }}>
                {formatTime(currentTime)}
              </Typography>
              <Slider
                value={currentTime}
                max={duration || 100}
                onChange={handleSeek}
                sx={{ flex: 1 }}
              />
              <Typography variant="caption" sx={{ minWidth: 40 }}>
                {formatTime(duration)}
              </Typography>
            </Stack>

            {/* Play/Pause and Volume */}
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton onClick={toggleMute} size="small">
                  {isMuted ? <IconVolumeOff size={20} /> : <IconVolume size={20} />}
                </IconButton>
                <Slider
                  value={isMuted ? 0 : volume}
                  max={1}
                  step={0.1}
                  onChange={handleVolumeChange}
                  size="small"
                  sx={{ width: 80 }}
                />
              </Stack>

              <IconButton
                onClick={togglePlay}
                color="primary"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  width: 56,
                  height: 56,
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {isPlaying ? <IconPlayerPause size={32} /> : <IconPlayerPlay size={32} />}
              </IconButton>

              <Box sx={{ width: 100 }} />
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PodcastsPage;
