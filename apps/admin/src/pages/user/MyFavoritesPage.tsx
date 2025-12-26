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
  Grid,
  useTheme,
  Tabs,
  Tab,
} from '@mui/material';
import {
  IconHeart,
  IconHeartFilled,
  IconPlayerPlay,
  IconMicrophone,
  IconHeadphones,
  IconStar,
} from '@tabler/icons-react';
import { apiClient } from '../../api/client';

interface FavoritePodcast {
  id: string;
  podcast: {
    id: string;
    title: string;
    description?: string;
    coverImageUrl?: string | null;
    owner?: {
      name: string;
    };
  };
  createdAt: string;
}

interface FavoriteEpisode {
  id: string;
  episode: {
    id: string;
    title: string;
    duration: number;
    audioUrl?: string | null;
    podcast: {
      id: string;
      title: string;
    };
  };
  createdAt: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}s ${minutes}dk`;
  }
  return `${minutes} dk`;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const MyFavoritesPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [podcasts, setPodcasts] = useState<FavoritePodcast[]>([]);
  const [episodes, setEpisodes] = useState<FavoriteEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/favorites');
        const favorites = response.data || [];
        const favoritePodcasts = favorites.filter((fav: any) => !!fav.podcast);
        const favoriteEpisodes = favorites.filter((fav: any) => !!fav.episode);
        setPodcasts(favoritePodcasts);
        setEpisodes(favoriteEpisodes);
      } catch (err: any) {
        setError('Favoriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemovePodcast = async (id: string) => {
    try {
      await apiClient.delete(`/favorites/${id}`);
      setPodcasts(podcasts.filter(item => item.id !== id));
    } catch {
      // Silme başarısız
    }
  };

  const handleRemoveEpisode = async (id: string) => {
    try {
      await apiClient.delete(`/favorites/${id}`);
      setEpisodes(episodes.filter(item => item.id !== id));
    } catch {
      // Silme başarısız
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={600} mb={3}>
          Favorilerim
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="rounded" width="100%" height={160} />
                  <Skeleton width="80%" height={24} sx={{ mt: 2 }} />
                  <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const EmptyState = ({ type }: { type: 'podcast' | 'episode' }) => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 8 }}>
        <Avatar
          sx={{
            bgcolor: theme.palette.error.light,
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 2,
          }}
        >
          <IconHeart size={40} color={theme.palette.error.main} />
        </Avatar>
        <Typography variant="h6" gutterBottom>
          Henüz favori {type === 'podcast' ? 'podcast' : 'bölüm'} yok
        </Typography>
        <Typography color="text.secondary">
          Beğendiğiniz {type === 'podcast' ? 'podcast\'leri' : 'bölümleri'} favorilere ekleyin
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Stack direction="row" alignItems="center" spacing={2} mb={1}>
          <Avatar sx={{ bgcolor: theme.palette.error.main, width: 48, height: 48 }}>
            <IconHeartFilled size={24} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={600}>
              Favorilerim
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Beğendiğiniz podcast ve bölümler
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab
            icon={<IconMicrophone size={18} />}
            iconPosition="start"
            label={`Podcast'ler (${podcasts.length})`}
          />
          <Tab
            icon={<IconHeadphones size={18} />}
            iconPosition="start"
            label={`Bölümler (${episodes.length})`}
          />
        </Tabs>
      </Box>

      {/* Podcasts Tab */}
      <TabPanel value={tabValue} index={0}>
        {podcasts.length === 0 ? (
          <EmptyState type="podcast" />
        ) : (
          <Grid container spacing={3}>
            {podcasts.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '100%',
                      bgcolor: theme.palette.grey[100],
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      src={item.podcast?.coverImageUrl || undefined}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: 0,
                      }}
                    >
                      <IconMicrophone size={48} />
                    </Avatar>
                    {/* Favorite Button */}
                    <IconButton
                      onClick={() => handleRemovePodcast(item.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'white' },
                      }}
                    >
                      <IconHeartFilled size={20} color={theme.palette.error.main} />
                    </IconButton>
                  </Box>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {item.podcast?.title || 'Bilinmeyen Podcast'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.podcast?.owner?.name || 'Bilinmeyen Hoca'}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={2}>
                      <Chip
                        size="small"
                        icon={<IconStar size={14} />}
                        label="Favori"
                        color="error"
                        variant="outlined"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Episodes Tab */}
      <TabPanel value={tabValue} index={1}>
        {episodes.length === 0 ? (
          <EmptyState type="episode" />
        ) : (
          <Stack spacing={2}>
            {episodes.map((item) => (
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
                      src={item.episode?.podcast?.coverImageUrl || undefined}
                      sx={{ width: 72, height: 72 }}
                    >
                      <IconHeadphones size={28} />
                    </Avatar>

                    {/* Content */}
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {item.episode?.title || 'Bilinmeyen Bölüm'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.episode?.podcast?.title || 'Bilinmeyen Podcast'}
                      </Typography>
                      <Stack direction="row" spacing={1} mt={1} alignItems="center">
                        <Chip
                          size="small"
                          label={formatDuration(item.episode?.duration || 0)}
                          variant="outlined"
                          sx={{ height: 24 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.createdAt)} tarihinde eklendi
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={1}>
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
                        onClick={() => handleRemoveEpisode(item.id)}
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': { bgcolor: theme.palette.error.light },
                        }}
                      >
                        <IconHeartFilled size={20} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </TabPanel>
    </Box>
  );
};

export default MyFavoritesPage;
