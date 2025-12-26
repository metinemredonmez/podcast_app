import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  Chip,
  Avatar,
  Skeleton,
  Alert,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  IconBroadcast,
  IconPlayerPlay,
  IconUsers,
  IconClock,
  IconCalendar,
  IconPlus,
  IconHistory,
  IconRefresh,
  IconDotsVertical,
  IconDownload,
  IconTrash,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

interface StreamHost {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Stream {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category?: {
    id: string;
    name: string;
  } | null;
  host: StreamHost;
  hlsUrl: string | null;
  viewerCount: number;
  roomCount: number;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  recordingUrl: string | null;
  scheduledAt?: string | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const LiveStreamsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [scheduledStreams, setScheduledStreams] = useState<Stream[]>([]);
  const [pastStreams, setPastStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);

  const fetchStreams = async () => {
    setLoading(true);
    setError(null);

    try {
      const [liveRes, scheduledRes, pastRes] = await Promise.all([
        apiClient.get('/live/streams'),
        apiClient.get('/live/streams/scheduled'),
        apiClient.get('/live/vod?limit=20'),
      ]);

      setLiveStreams(liveRes.data);
      setScheduledStreams(scheduledRes.data);
      setPastStreams(pastRes.data.streams || pastRes.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Yayınlar yüklenemedi';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} saat ${m} dk`;
    return `${m} dk`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StreamCard = ({
    stream,
    showStatus = false,
  }: {
    stream: Stream;
    showStatus?: boolean;
  }) => (
    <Card
      sx={{
        height: '100%',
        cursor: stream.status === 'LIVE' ? 'pointer' : 'default',
        '&:hover':
          stream.status === 'LIVE'
            ? { boxShadow: 4 }
            : {},
      }}
      onClick={() => {
        if (stream.status === 'LIVE') {
          navigate(`/live/${stream.id}`);
        }
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={stream.host?.avatarUrl || ''} sx={{ width: 48, height: 48 }}>
              {stream.host?.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {stream.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stream.host?.name}
              </Typography>
            </Box>
          </Stack>

          {showStatus && (
            <Chip
              label={
                stream.status === 'LIVE'
                  ? '🔴 CANLI'
                  : stream.status === 'SCHEDULED'
                    ? 'Planlandı'
                    : stream.status === 'ENDED'
                      ? 'Sona Erdi'
                      : stream.status
              }
              color={
                stream.status === 'LIVE'
                  ? 'error'
                  : stream.status === 'SCHEDULED'
                    ? 'info'
                    : 'default'
              }
              size="small"
            />
          )}
        </Stack>

        {stream.description && (
          <Typography variant="body2" color="text.secondary" mb={2} noWrap>
            {stream.description}
          </Typography>
        )}

        <Stack direction="row" spacing={2} flexWrap="wrap">
          {stream.category?.name && (
            <Chip size="small" label={stream.category.name} variant="outlined" />
          )}
          {stream.status === 'LIVE' && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconUsers size={16} />
              <Typography variant="body2">{stream.viewerCount} izleyici</Typography>
            </Stack>
          )}

          {stream.status === 'SCHEDULED' && stream.scheduledAt && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconCalendar size={16} />
              <Typography variant="body2">{formatDate(stream.scheduledAt)}</Typography>
            </Stack>
          )}

          {stream.status === 'ENDED' && (
            <>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconClock size={16} />
                <Typography variant="body2">{formatDuration(stream.duration)}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconCalendar size={16} />
                <Typography variant="body2">{formatDate(stream.endedAt)}</Typography>
              </Stack>
            </>
          )}
        </Stack>

        {stream.status === 'ENDED' && stream.recordingUrl && (
          <Button
            size="small"
            startIcon={<IconPlayerPlay size={16} />}
            sx={{ mt: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              window.open(stream.recordingUrl!, '_blank');
            }}
          >
            Kaydı Dinle
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message, icon: Icon }: { message: string; icon: React.ElementType }) => (
    <Box textAlign="center" py={8} color="text.secondary">
      <Icon size={64} style={{ opacity: 0.3 }} />
      <Typography variant="body1" mt={2}>
        {message}
      </Typography>
    </Box>
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, stream: Stream) => {
    setAnchorEl(event.currentTarget);
    setSelectedStream(stream);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStream(null);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteStream = async (streamId: string) => {
    if (!window.confirm('Bu yayını silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await apiClient.delete(`/live/streams/${streamId}`);
      setPastStreams((prev) => prev.filter((s) => s.id !== streamId));
      handleMenuClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      setError(message);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} mb={0.5}>
            Canlı Yayınlar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aktif ve geçmiş yayınları yönetin
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Yenile">
            <IconButton onClick={fetchStreams}>
              <IconRefresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<IconPlus />}
            onClick={() => navigate('/live/broadcast')}
          >
            Yayın Başlat
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab
          icon={<IconBroadcast size={18} />}
          iconPosition="start"
          label={`Canlı (${liveStreams.length})`}
        />
        <Tab
          icon={<IconCalendar size={18} />}
          iconPosition="start"
          label={`Planlanan (${scheduledStreams.length})`}
        />
        <Tab
          icon={<IconHistory size={18} />}
          iconPosition="start"
          label={`Geçmiş (${pastStreams.length})`}
        />
      </Tabs>

      {/* Canlı Yayınlar */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : liveStreams.length === 0 ? (
          <EmptyState message="Şu anda aktif yayın yok" icon={IconBroadcast} />
        ) : (
          <Grid container spacing={3}>
            {liveStreams.map((stream) => (
              <Grid item xs={12} md={6} lg={4} key={stream.id}>
                <StreamCard stream={stream} showStatus />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Planlanan Yayınlar */}
      <TabPanel value={tabValue} index={1}>
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2].map((i) => (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : scheduledStreams.length === 0 ? (
          <EmptyState message="Planlanan yayın yok" icon={IconCalendar} />
        ) : (
          <Grid container spacing={3}>
            {scheduledStreams.map((stream) => (
              <Grid item xs={12} md={6} lg={4} key={stream.id}>
                <StreamCard stream={stream} showStatus />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Geçmiş Yayınlar - Tablo Formatı */}
      <TabPanel value={tabValue} index={2}>
        {loading ? (
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
            ))}
          </Box>
        ) : pastStreams.length === 0 ? (
          <EmptyState message="Henüz kaydedilmiş yayın yok" icon={IconHistory} />
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Yayın</TableCell>
                    <TableCell>Kategori</TableCell>
                    <TableCell>Süre</TableCell>
                    <TableCell>Tarih</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pastStreams
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((stream) => (
                      <TableRow
                        key={stream.id}
                        hover
                        onClick={() => stream.recordingUrl && navigate(`/live/${stream.id}`)}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          cursor: stream.recordingUrl ? 'pointer' : 'default',
                          opacity: stream.recordingUrl ? 1 : 0.7,
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              src={stream.host?.avatarUrl || ''}
                              sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                            >
                              {stream.host?.name?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {stream.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {stream.host?.name}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {stream.category?.name ? (
                            <Chip
                              label={stream.category.name}
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconClock size={16} />
                            <Typography variant="body2">
                              {formatDuration(stream.duration)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(stream.endedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="Sona Erdi"
                            size="small"
                            color="default"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                            {stream.recordingUrl ? (
                              <Tooltip title="Kaydı Dinle">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/live/${stream.id}`);
                                  }}
                                >
                                  <IconPlayerPlay size={18} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                Kayıt yok
                              </Typography>
                            )}
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e, stream);
                              }}
                            >
                              <IconDotsVertical size={18} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={pastStreams.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Sayfa başına:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            />
          </Paper>
        )}
      </TabPanel>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedStream?.recordingUrl && (
          <MenuItem
            onClick={() => {
              window.open(selectedStream.recordingUrl!, '_blank');
              handleMenuClose();
            }}
          >
            <IconDownload size={18} style={{ marginRight: 8 }} />
            İndir
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            if (selectedStream) {
              handleDeleteStream(selectedStream.id);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <IconTrash size={18} style={{ marginRight: 8 }} />
          Sil
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LiveStreamsPage;
