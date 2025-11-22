import React from 'react';
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
} from '@mui/material';
import {
  IconMicrophone,
  IconHeadphones,
  IconUsers,
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';

interface StatCardProps {
  title: string;
  value: string;
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
              {value}
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
                vs last month
              </Typography>
            </Stack>
          </Box>
          <Avatar
            sx={{
              bgcolor: color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
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

const DashboardPage: React.FC = () => {
  const theme = useTheme();

  const stats = [
    {
      title: 'Total Podcasts',
      value: '1,234',
      change: 12.5,
      icon: <IconMicrophone size={24} color="#fff" />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Total Episodes',
      value: '5,678',
      change: 8.2,
      icon: <IconHeadphones size={24} color="#fff" />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'Active Users',
      value: '12,450',
      change: -2.4,
      icon: <IconUsers size={24} color="#fff" />,
      color: theme.palette.success.main,
    },
    {
      title: 'Total Plays',
      value: '89.5K',
      change: 15.8,
      icon: <IconChartBar size={24} color="#fff" />,
      color: theme.palette.warning.main,
    },
  ];

  const recentPodcasts = [
    { title: 'Tech Talk Daily', subtitle: 'Technology', time: '2 min ago' },
    { title: 'History Uncovered', subtitle: 'Education', time: '15 min ago' },
    { title: 'Mindful Mornings', subtitle: 'Health', time: '1 hour ago' },
    { title: 'Sports Roundup', subtitle: 'Sports', time: '2 hours ago' },
    { title: 'True Crime Files', subtitle: 'Crime', time: '3 hours ago' },
  ];

  const topPodcasts = [
    { name: 'Tech Talk Daily', plays: 45230, progress: 90 },
    { name: 'True Crime Files', plays: 38920, progress: 78 },
    { name: 'History Uncovered', plays: 32100, progress: 64 },
    { name: 'Mindful Mornings', plays: 28500, progress: 57 },
    { name: 'Sports Roundup', plays: 21800, progress: 44 },
  ];

  return (
    <Box>
      {/* Page Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back! Here's what's happening with your podcasts.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Top Podcasts */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={3}>
                Top Performing Podcasts
              </Typography>
              <Stack spacing={2}>
                {topPodcasts.map((podcast, index) => (
                  <Box key={index}>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={500}>
                        {podcast.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {podcast.plays.toLocaleString()} plays
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={podcast.progress}
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
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Podcasts */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Recent Podcasts
              </Typography>
              <Stack divider={<Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }} />}>
                {recentPodcasts.map((podcast, index) => (
                  <RecentItem key={index} {...podcast} />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
