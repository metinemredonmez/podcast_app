import React, { useEffect, useState } from 'react';
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
  Avatar,
  CircularProgress,
  Alert,
  MenuItem,
} from '@mui/material';
import { IconSearch } from '@tabler/icons-react';
import { followersService, FollowerRecord } from '../../api/services/followers.service';
import { podcastService, Podcast } from '../../api/services/podcast.service';

const FollowersPage: React.FC = () => {
  const [followers, setFollowers] = useState<FollowerRecord[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [podcastId, setPodcastId] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchFollowers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await followersService.list({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        podcastId: podcastId || undefined,
      });
      setFollowers(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Takipçiler yüklenemedi';
      setError(message);
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPodcasts = async () => {
    try {
      const response = await podcastService.list({ limit: 100 });
      setPodcasts(response.data || []);
    } catch {
      setPodcasts([]);
    }
  };

  useEffect(() => {
    fetchPodcasts();
  }, []);

  useEffect(() => {
    fetchFollowers();
  }, [page, rowsPerPage, search, podcastId]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Stack spacing={1} mb={3}>
        <Typography variant="h4" fontWeight={600}>
          Takipçilerim
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Podcast'lerinizi takip eden kullanıcıları görüntüleyin.
        </Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
            <TextField
              fullWidth
              placeholder="Kullanıcı veya podcast ara..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              fullWidth
              label="Podcast"
              value={podcastId}
              onChange={(event) => {
                setPodcastId(event.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Tümü</MenuItem>
              {podcasts.map((podcast) => (
                <MenuItem key={podcast.id} value={podcast.id}>
                  {podcast.title}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Kullanıcı</TableCell>
                      <TableCell>E-posta</TableCell>
                      <TableCell>Podcast</TableCell>
                      <TableCell align="right">Takip Tarihi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {followers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Henüz takipçi bulunmuyor
                        </TableCell>
                      </TableRow>
                    ) : (
                      followers.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar src={item.user.avatarUrl || undefined}>
                                {(item.user.name || item.user.email || 'U').charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {item.user.name || 'İsimsiz'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{item.user.email}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar src={item.podcast.coverImageUrl || undefined} variant="rounded">
                                {(item.podcast.title || 'P').charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {item.podcast.title}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {new Date(item.createdAt).toLocaleDateString('tr-TR')}
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
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 20, 50]}
                labelRowsPerPage="Sayfa başına"
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FollowersPage;
