import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  IconSearch,
  IconPlayerPlay,
  IconClock,
  IconRefresh,
} from '@tabler/icons-react';
import { episodeService, Episode } from '../../api/services/episode.service';
import { logger } from '../../utils/logger';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const EpisodesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'audio' | 'video'>('all');

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
      setTotal(response.hasMore ? (page + 2) * rowsPerPage : (page * rowsPerPage) + (response.data?.length || 0));
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const media = params.get('media');
    if (media === 'audio' || media === 'video' || media === 'all') {
      setMediaFilter(media);
    }
  }, [location.search]);

  const filteredEpisodes = episodes.filter((episode) => {
    if (mediaFilter === 'all') return true;
    const podcastMedia = episode.podcast?.mediaType;
    if (mediaFilter === 'audio') {
      return podcastMedia === 'AUDIO';
    }
    return podcastMedia === 'VIDEO';
  });

  const handleBulkAction = async (actionId: string) => {
    if (actionId === 'export') {
      // TODO: Implement export functionality
      logger.info('Exporting episodes');
    } else if (actionId.startsWith('status-')) {
      const status = actionId.replace('status-', '');
      // TODO: Implement bulk status update
      logger.info('Updating status to:', status);
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
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={fetchEpisodes} disabled={loading}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
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
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            mb={3}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              placeholder="Search episodes..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 260 }, flexGrow: 1, maxWidth: { sm: 520 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
            />
            <Tabs
              value={mediaFilter}
              onChange={(_, value) => {
                setMediaFilter(value);
                const params = new URLSearchParams(location.search);
                if (value === 'all') {
                  params.delete('media');
                } else {
                  params.set('media', value);
                }
                navigate({ search: params.toString() }, { replace: true });
              }}
              textColor="primary"
              indicatorColor="primary"
              sx={{ minHeight: 36, flexShrink: 0 }}
            >
              <Tab value="all" label="Tümü" sx={{ minHeight: 36 }} />
              <Tab value="audio" label="Ses" sx={{ minHeight: 36 }} />
              <Tab value="video" label="Video" sx={{ minHeight: 36 }} />
            </Tabs>
          </Stack>

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
                      <TableCell>Episode</TableCell>
                      <TableCell>Podcast</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Plays</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEpisodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary" py={4}>
                            No episodes found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEpisodes.map((episode) => (
                        <TableRow
                          key={episode.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/episodes/${episode.id}`)}
                        >
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
                                  Episode #{episode.episodeNumber ?? '-'}
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

    </Box>
  );
};

export default EpisodesPage;
