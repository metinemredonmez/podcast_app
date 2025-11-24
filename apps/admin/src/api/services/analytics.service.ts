import { apiClient } from '../client';

export interface DashboardStats {
  totalPodcasts: number;
  totalEpisodes: number;
  totalUsers: number;
  totalPlays: number;
  podcastsGrowth: number;
  episodesGrowth: number;
  usersGrowth: number;
  playsGrowth: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface TopPodcast {
  id: string;
  title: string;
  plays: number;
  episodes: number;
}

export interface DeviceStats {
  device: string;
  count: number;
  percentage: number;
}

export interface GeographyStats {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
}

export interface ListeningHours {
  hour: number;
  count: number;
}

export interface AnalyticsKPI {
  totalPlays: number;
  uniqueListeners: number;
  avgListenDuration: number; // in seconds
  completionRate: number; // percentage
  newSubscribers: number;
  playsChange: number; // percentage
  listenersChange: number;
  durationChange: number;
  completionChange: number;
  subscribersChange: number;
}

export interface AnalyticsParams {
  from?: string;
  to?: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  compareWith?: string; // previous period
}

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  async getKPIs(params: AnalyticsParams = {}): Promise<AnalyticsKPI> {
    const response = await apiClient.get('/analytics/kpis', { params });
    return response.data;
  },

  async getPlaysOverTime(params: AnalyticsParams = {}): Promise<TimeSeriesData[]> {
    const response = await apiClient.get('/analytics/plays', { params });
    return response.data;
  },

  async getUserGrowth(params: AnalyticsParams = {}): Promise<TimeSeriesData[]> {
    const response = await apiClient.get('/analytics/users', { params });
    return response.data;
  },

  async getTopPodcasts(limit: number = 10, params: AnalyticsParams = {}): Promise<TopPodcast[]> {
    const response = await apiClient.get('/analytics/top-podcasts', { params: { limit, ...params } });
    return response.data;
  },

  async getDeviceBreakdown(params: AnalyticsParams = {}): Promise<DeviceStats[]> {
    const response = await apiClient.get('/analytics/devices', { params });
    return response.data;
  },

  async getGeography(params: AnalyticsParams = {}): Promise<GeographyStats[]> {
    const response = await apiClient.get('/analytics/geography', { params });
    return response.data;
  },

  async getPeakListeningHours(params: AnalyticsParams = {}): Promise<ListeningHours[]> {
    const response = await apiClient.get('/analytics/peak-hours', { params });
    return response.data;
  },

  async getCategoryDistribution(): Promise<{ category: string; count: number }[]> {
    const response = await apiClient.get('/analytics/categories');
    return response.data;
  },

  async exportData(format: 'csv' | 'json', params: AnalyticsParams = {}): Promise<Blob> {
    const response = await apiClient.get(`/analytics/export/${format}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// Legacy export for backwards compatibility
export const analyticService = analyticsService;
