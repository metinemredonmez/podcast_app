import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Skeleton,
  Alert,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  IconPlayerPlay,
  IconClock,
  IconCalendar,
  IconHeadphones,
  IconTrash,
} from '@tabler/icons-react';
import { apiClient } from '../../api/client';

interface HistoryItem {
  id: string;
  episodeId: string;
  progressSeconds: number;
  progressPercentage: number;
  completed: boolean;
  lastPlayedAt: string;
  episode: {
    id: string;
    title: string;
    slug: string;
    duration: number;
    audioUrl?: string;
    coverImageUrl?: string;
    podcastId: string;
    podcastTitle: string;
    podcastSlug: string;
  };
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}s ${minutes}dk`;
  }
  return `${minutes} dk`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const MyHistoryPage: React.FC = () => {
  const theme = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/progress/history/recently-played?limit=50');
        setHistory(response.data.items || []);
      } catch (err: any) {
        setError('Dinleme geçmişi yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleRemoveFromHistory = async (id: string) => {
    try {
      const item = history.find((entry) => entry.id === id);
      if (!item) return;
      await apiClient.delete(`/progress/${item.episodeId}`);
      setHistory(history.filter((entry) => entry.id !== id));
    } catch {
      // Silme başarısız
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={600} mb={3}>
          Dinleme Geçmişi
        </Typography>
        <Stack spacing={2}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="rounded" width={80} height={80} />
                  <Box flex={1}>
                    <Skeleton width="60%" height={24} />
                    <Skeleton width="40%" height={20} sx={{ mt: 1 }} />
                    <Skeleton width="100%" height={8} sx={{ mt: 2 }} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Stack direction="row" alignItems="center" spacing={2} mb={1}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
            <IconHeadphones size={24} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={600}>
              Dinleme Geçmişi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Son dinlediğiniz podcast bölümleri
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {history.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.grey[100],
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
              }}
            >
              <IconHeadphones size={40} color={theme.palette.grey[400]} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Henüz dinleme geçmişiniz yok
            </Typography>
            <Typography color="text.secondary">
              Podcast'leri dinlemeye başladığınızda burada görünecekler
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {history.map((item) => (
            <Card
              key={item.id}
              sx={{
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Cover Image */}
                  <Avatar
                    variant="rounded"
                    src={item.episode?.coverImageUrl}
                    sx={{ width: 80, height: 80 }}
                  >
                    <IconHeadphones size={32} />
                  </Avatar>

                  {/* Content */}
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {item.episode?.title || 'Bilinmeyen Bölüm'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.episode?.podcastTitle || 'Bilinmeyen Podcast'}
                    </Typography>

                    {/* Progress Bar */}
                    <Box mt={1.5}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {item.completed ? 'Tamamlandı' : `%${Math.round(item.progressPercentage)} dinlendi`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDuration(item.episode?.duration || 0)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={item.completed ? 100 : item.progressPercentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            bgcolor: item.completed ? theme.palette.success.main : theme.palette.primary.main,
                          },
                        }}
                      />
                    </Box>

                    {/* Meta Info */}
                    <Stack direction="row" spacing={2} mt={1.5} alignItems="center">
                      <Chip
                        icon={<IconCalendar size={14} />}
                        label={formatDate(item.lastPlayedAt)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24 }}
                      />
                      {item.completed && (
                        <Chip
                          label="Tamamlandı"
                          size="small"
                          color="success"
                          sx={{ height: 24 }}
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Actions */}
                  <Stack spacing={1}>
                    <IconButton
                      color="primary"
                      sx={{
                        bgcolor: theme.palette.primary.light,
                        '&:hover': { bgcolor: theme.palette.primary.main, color: 'white' },
                      }}
                    >
                      <IconPlayerPlay size={20} />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleRemoveFromHistory(item.id)}
                      sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                    >
                      <IconTrash size={18} />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default MyHistoryPage;
