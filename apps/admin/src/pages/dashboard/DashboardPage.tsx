import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
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
  IconHeart,
  IconHistory,
} from '@tabler/icons-react';
import { dashboardService, DashboardStats, TopPodcast } from '../../api/services/dashboard.service';
import { selectUser } from '../../store/slices/authSlice';

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
  const user = useSelector(selectUser);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPodcasts, setTopPodcasts] = useState<TopPodcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin rolleri - bu roller admin istatistiklerini görebilir
  const isAdmin = user?.role && ['SUPER_ADMIN', 'ADMIN', 'HOCA'].includes(user.role);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Sadece admin rolleri için istatistikleri çek
        if (isAdmin) {
          const [statsData, topPodcastsData] = await Promise.all([
            dashboardService.getStats(),
            dashboardService.getTopPodcasts(5),
          ]);
          setStats(statsData);
          setTopPodcasts(topPodcastsData);
        }
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        // 403 hatası için özel mesaj
        if (err?.response?.status === 403) {
          setError(null); // 403 için hata gösterme, sadece USER dashboard'u göster
        } else {
          setError(err?.response?.data?.message || 'Dashboard verileri yüklenirken hata oluştu');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

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

  // USER için özel dashboard
  if (!isAdmin) {
    return (
      <Box>
        {/* Page Header */}
        <Box mb={4}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Hoş Geldiniz, {user?.name || 'Kullanıcı'}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Podcast dünyasını keşfedin ve favori içeriklerinizi takip edin.
          </Typography>
        </Box>

        {/* Quick Actions for USER */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => window.location.href = '/my-history'}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 64, height: 64, mx: 'auto', mb: 2 }}>
                  <IconHistory size={32} color="#fff" />
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  Dinleme Geçmişi
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Son dinlediğiniz podcast'ler
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => window.location.href = '/my-favorites'}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: theme.palette.error.main, width: 64, height: 64, mx: 'auto', mb: 2 }}>
                  <IconHeart size={32} color="#fff" />
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  Favorilerim
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Beğendiğiniz içerikler
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => window.location.href = '/profile'}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main, width: 64, height: 64, mx: 'auto', mb: 2 }}>
                  <IconUsers size={32} color="#fff" />
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  Profilim
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hesap ayarlarınız
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Info Card */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Podcast Keşfet
            </Typography>
            <Typography color="text.secondary">
              Mobil uygulamamızı indirerek binlerce podcast'e erişebilir,
              çevrimdışı dinleyebilir ve kişiselleştirilmiş öneriler alabilirsiniz.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ADMIN / HOCA için dashboard
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
