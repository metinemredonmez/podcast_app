import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Avatar,
  LinearProgress,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import {
  IconMicrophone,
  IconHeadphones,
  IconUsers,
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import { analyticsService, DashboardStats, TopPodcast } from '../../api/services/analytics.service';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => {
  const theme = useTheme();
  const isPositive = change >= 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
              {isPositive ? (
                <IconTrendingUp size={16} color={theme.palette.success.main} />
              ) : (
                <IconTrendingDown size={16} color={theme.palette.error.main} />
              )}
              <Typography
                variant="caption"
                color={isPositive ? 'success.main' : 'error.main'}
                fontWeight={600}
              >
                {isPositive ? '+' : ''}{change}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs last period
              </Typography>
            </Stack>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};

const AnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPodcasts, setTopPodcasts] = useState<TopPodcast[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, podcastsData] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getTopPodcasts(10),
      ]);
      setStats(statsData);
      setTopPodcasts(podcastsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
      // Set mock data for demo
      setStats({
        totalPodcasts: 1234,
        totalEpisodes: 5678,
        totalUsers: 12450,
        totalPlays: 89500,
        podcastsGrowth: 12.5,
        episodesGrowth: 8.2,
        usersGrowth: -2.4,
        playsGrowth: 15.8,
      });
      setTopPodcasts([
        { id: '1', title: 'Tech Talk Daily', plays: 45230, episodes: 120 },
        { id: '2', title: 'True Crime Files', plays: 38920, episodes: 85 },
        { id: '3', title: 'History Uncovered', plays: 32100, episodes: 92 },
        { id: '4', title: 'Mindful Mornings', plays: 28500, episodes: 156 },
        { id: '5', title: 'Sports Roundup', plays: 21800, episodes: 204 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const maxPlays = Math.max(...topPodcasts.map((p) => p.plays));

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Platform performance and insights
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, value) => value && setPeriod(value)}
          size="small"
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="year">Year</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Using demo data: {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total Podcasts"
              value={stats.totalPodcasts}
              change={stats.podcastsGrowth}
              icon={<IconMicrophone size={24} color="#fff" />}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total Episodes"
              value={stats.totalEpisodes}
              change={stats.episodesGrowth}
              icon={<IconHeadphones size={24} color="#fff" />}
              color={theme.palette.secondary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Active Users"
              value={stats.totalUsers}
              change={stats.usersGrowth}
              icon={<IconUsers size={24} color="#fff" />}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total Plays"
              value={stats.totalPlays >= 1000 ? `${(stats.totalPlays / 1000).toFixed(1)}K` : stats.totalPlays}
              change={stats.playsGrowth}
              icon={<IconChartBar size={24} color="#fff" />}
              color={theme.palette.warning.main}
            />
          </Grid>
        </Grid>
      )}

      {/* Charts Row */}
      <Grid container spacing={3}>
        {/* Top Podcasts */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Top Performing Podcasts
              </Typography>
              <Stack spacing={2.5}>
                {topPodcasts.map((podcast, index) => (
                  <Box key={podcast.id}>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: index < 3 ? 'primary.light' : 'grey.100',
                            color: index < 3 ? 'primary.main' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {index + 1}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {podcast.title}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          {podcast.episodes} episodes
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {podcast.plays.toLocaleString()} plays
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(podcast.plays / maxPlays) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: index < 3 ? theme.palette.primary.main : theme.palette.grey[400],
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Quick Insights
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Average Plays per Episode
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {stats ? Math.round(stats.totalPlays / stats.totalEpisodes).toLocaleString() : 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Average Episodes per Podcast
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {stats ? (stats.totalEpisodes / stats.totalPodcasts).toFixed(1) : 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    User to Podcast Ratio
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {stats ? Math.round(stats.totalUsers / stats.totalPodcasts) : 0}:1
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Plays per User
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {stats ? (stats.totalPlays / stats.totalUsers).toFixed(1) : 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
