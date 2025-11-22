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
} from '@mui/material';
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
} from '@tabler/icons-react';
import { podcastService, Podcast } from '../../api/services/podcast.service';

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
        <Button
          variant="contained"
          startIcon={<IconPlus size={20} />}
          onClick={() => navigate('/podcasts/new')}
        >
          Add Podcast
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
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" py={4}>
                            No podcasts found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      podcasts.map((podcast) => (
                        <TableRow key={podcast.id} hover>
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
    </Box>
  );
};

export default PodcastsPage;
