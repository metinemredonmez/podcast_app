import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Button,
  useTheme,
} from '@mui/material';
import {
  IconHeadphones,
  IconUsers,
  IconClock,
  IconCheck,
  IconUserPlus,
  IconDownload,
  IconFileTypeCsv,
  IconPhoto,
} from '@tabler/icons-react';
import { subDays, format as formatDate } from 'date-fns';
import { DateRangePicker, KPICard, DateRange } from '../../components/analytics';
import { LineChart, AreaChart, BarChart, PieChart, HeatmapChart } from '../../components/charts';
import {
  analyticsService,
  AnalyticsKPI,
  TimeSeriesData,
  TopPodcast,
  DeviceStats,
  GeographyStats,
  ListeningHours,
} from '../../api/services/analytics.service';

const AdvancedAnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date(),
    label: 'Last 30 days',
  });
  const [compareEnabled, setCompareEnabled] = useState(false);

  // Data states
  const [kpis, setKpis] = useState<AnalyticsKPI | null>(null);
  const [playsOverTime, setPlaysOverTime] = useState<TimeSeriesData[]>([]);
  const [userGrowth, setUserGrowth] = useState<TimeSeriesData[]>([]);
  const [topPodcasts, setTopPodcasts] = useState<TopPodcast[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceStats[]>([]);
  const [geography, setGeography] = useState<GeographyStats[]>([]);
  const [peakHours, setPeakHours] = useState<ListeningHours[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const params = {
      from: formatDate(dateRange.from, 'yyyy-MM-dd'),
      to: formatDate(dateRange.to, 'yyyy-MM-dd'),
      groupBy: 'day' as const,
    };

    try {
      const [kpisData, playsData, usersData, podcastsData, devicesData, geoData, hoursData] =
        await Promise.all([
          analyticsService.getKPIs(params),
          analyticsService.getPlaysOverTime(params),
          analyticsService.getUserGrowth(params),
          analyticsService.getTopPodcasts(10, params),
          analyticsService.getDeviceBreakdown(params),
          analyticsService.getGeography(params),
          analyticsService.getPeakListeningHours(params),
        ]);

      setKpis(kpisData);
      setPlaysOverTime(playsData);
      setUserGrowth(usersData);
      setTopPodcasts(podcastsData);
      setDeviceBreakdown(devicesData);
      setGeography(geoData);
      setPeakHours(hoursData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleExport = async (format: 'csv' | 'png') => {
    setExporting(true);
    try {
      if (format === 'csv') {
        const blob = await analyticsService.exportData('csv', {
          from: formatDate(dateRange.from, 'yyyy-MM-dd'),
          to: formatDate(dateRange.to, 'yyyy-MM-dd'),
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${formatDate(dateRange.from, 'yyyy-MM-dd')}-to-${formatDate(dateRange.to, 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (format === 'png') {
        // For PNG export, we'd typically use a library like html2canvas
        // For now, just show an alert
        alert('PNG export would be implemented using html2canvas or similar library');
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Advanced Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive insights and performance metrics
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<IconFileTypeCsv size={18} />}
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<IconPhoto size={18} />}
            onClick={() => handleExport('png')}
            disabled={exporting}
          >
            Export PNG
          </Button>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            showCompare
            compareEnabled={compareEnabled}
            onCompareChange={setCompareEnabled}
          />
        </Stack>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      {kpis && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} lg={2.4}>
            <KPICard
              title="Total Plays"
              value={kpis.totalPlays}
              change={kpis.playsChange}
              icon={<IconHeadphones size={24} color="#fff" />}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={2.4}>
            <KPICard
              title="Unique Listeners"
              value={kpis.uniqueListeners}
              change={kpis.listenersChange}
              icon={<IconUsers size={24} color="#fff" />}
              color={theme.palette.secondary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={2.4}>
            <KPICard
              title="Avg Listen Duration"
              value={formatDuration(kpis.avgListenDuration)}
              change={kpis.durationChange}
              icon={<IconClock size={24} color="#fff" />}
              color={theme.palette.info.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={2.4}>
            <KPICard
              title="Completion Rate"
              value={kpis.completionRate}
              change={kpis.completionChange}
              icon={<IconCheck size={24} color="#fff" />}
              color={theme.palette.success.main}
              suffix="%"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={2.4}>
            <KPICard
              title="New Subscribers"
              value={kpis.newSubscribers}
              change={kpis.subscribersChange}
              icon={<IconUserPlus size={24} color="#fff" />}
              color={theme.palette.warning.main}
            />
          </Grid>
        </Grid>
      )}

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Plays Over Time */}
        <Grid item xs={12} lg={8}>
          <AreaChart
            title="Plays Over Time"
            data={playsOverTime}
            height={350}
            color={theme.palette.primary.main}
          />
        </Grid>

        {/* Device Breakdown */}
        <Grid item xs={12} lg={4}>
          <PieChart
            title="Device Breakdown"
            data={deviceBreakdown.map((d) => ({ label: d.device, value: d.count }))}
            height={350}
            donut
          />
        </Grid>

        {/* Top Podcasts */}
        <Grid item xs={12} lg={6}>
          <BarChart
            title="Top 10 Podcasts"
            data={topPodcasts.map((p) => ({ label: p.title, value: p.plays }))}
            height={400}
            horizontal
            color={theme.palette.secondary.main}
          />
        </Grid>

        {/* User Growth */}
        <Grid item xs={12} lg={6}>
          <LineChart
            title="User Growth"
            data={userGrowth}
            height={400}
            color={theme.palette.success.main}
          />
        </Grid>

        {/* Peak Listening Hours */}
        <Grid item xs={12}>
          <HeatmapChart title="Peak Listening Hours" data={peakHours} height={300} />
        </Grid>

        {/* Geographic Distribution */}
        <Grid item xs={12}>
          <BarChart
            title="Top Countries"
            data={geography.slice(0, 10).map((g) => ({ label: g.country, value: g.count }))}
            height={350}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdvancedAnalyticsPage;
