import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  LinearProgress,
  Avatar,
  useTheme,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  IconMicrophone,
  IconHeadphones,
  IconUsers,
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import { dashboardService, DashboardStats, TopPodcast } from '../../api/services/dashboard.service';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, loading }) => {
  const theme = useTheme();
  const isPositive = change >= 0;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Skeleton width="60%" height={20} />
              <Skeleton width="40%" height={40} sx={{ mt: 1 }} />
              <Skeleton width="80%" height={16} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="circular" width={48} height={48} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Stack>
        <Typography variant="h4" fontWeight={600}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {title}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
          {isPositive ? (
            <IconTrendingUp size={14} color={theme.palette.success.main} />
          ) : (
            <IconTrendingDown size={14} color={theme.palette.error.main} />
          )}
          <Typography
            variant="caption"
            color={isPositive ? 'success.main' : 'error.main'}
            fontWeight={600}
          >
            {isPositive ? '+' : ''}{change}%
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

interface RecentItemProps {
  title: string;
  subtitle: string;
  time: string;
  avatar?: string;
}

const RecentItem: React.FC<RecentItemProps> = ({ title, subtitle, time, avatar }) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center" py={1.5}>
      <Avatar src={avatar} sx={{ width: 40, height: 40 }}>
        {title.charAt(0)}
      </Avatar>
      <Box flex={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {time}
      </Typography>
    </Stack>
  );
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('tr-TR');
};

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPodcasts, setTopPodcasts] = useState<TopPodcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, topPodcastsData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getTopPodcasts(5),
        ]);
        setStats(statsData);
        setTopPodcasts(topPodcastsData);
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err?.response?.data?.message || 'Dashboard verileri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Toplam Podcast',
      value: stats?.totalPodcasts ?? 0,
      change: stats?.growthMetrics?.podcastsGrowth ?? 0,
      icon: <IconMicrophone size={24} color="#fff" />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Toplam Bölüm',
      value: stats?.totalEpisodes ?? 0,
      change: stats?.growthMetrics?.episodesGrowth ?? 0,
      icon: <IconHeadphones size={24} color="#fff" />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'Aktif Kullanıcı',
      value: stats?.totalUsers ?? 0,
      change: stats?.growthMetrics?.usersGrowth ?? 0,
      icon: <IconUsers size={24} color="#fff" />,
      color: theme.palette.success.main,
    },
    {
      title: 'Toplam Dinlenme',
      value: stats?.totalPlays ?? 0,
      change: 0,
      icon: <IconChartBar size={24} color="#fff" />,
      color: theme.palette.warning.main,
    },
  ];

  // Calculate max plays for progress bar
  const maxPlays = topPodcasts.length > 0
    ? Math.max(...topPodcasts.map(p => p.playCount))
    : 1;

  return (
    <Box>
      {/* Page Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Kontrol Paneli
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Hoş geldiniz! Podcast'lerinizle ilgili güncel bilgiler.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <StatCard {...stat} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Top Podcasts */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                En Çok Dinlenen Podcast'ler
              </Typography>
              {loading ? (
                <Stack spacing={2}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Box key={i}>
                      <Skeleton width="100%" height={20} />
                      <Skeleton width="100%" height={8} sx={{ mt: 1 }} />
                    </Box>
                  ))}
                </Stack>
              ) : topPodcasts.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  Henüz podcast verisi bulunmuyor
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {topPodcasts.map((podcast) => (
                    <Box key={podcast.id}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {podcast.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {podcast.playCount.toLocaleString()} dinlenme
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(podcast.playCount / maxPlays) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Podcasts */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Son Eklenen Podcast'ler
              </Typography>
              {loading ? (
                <Stack spacing={2}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Stack key={i} direction="row" spacing={2} alignItems="center">
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box flex={1}>
                        <Skeleton width="80%" height={20} />
                        <Skeleton width="60%" height={16} />
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              ) : !stats?.recentPodcasts?.length ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  Henüz podcast bulunmuyor
                </Typography>
              ) : (
                <Stack divider={<Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }} />}>
                  {stats.recentPodcasts.map((podcast) => (
                    <RecentItem
                      key={podcast.id}
                      title={podcast.title}
                      subtitle={podcast.owner?.name || podcast.owner?.email || 'Unknown'}
                      time={formatTimeAgo(podcast.createdAt)}
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
