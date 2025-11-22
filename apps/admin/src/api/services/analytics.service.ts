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

export interface TopPodcast {
  id: string;
  title: string;
  plays: number;
  episodes: number;
}

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  async getPlaysChart(period: 'week' | 'month' | 'year' = 'month'): Promise<ChartData> {
    const response = await apiClient.get('/analytics/plays', { params: { period } });
    return response.data;
  },

  async getUsersChart(period: 'week' | 'month' | 'year' = 'month'): Promise<ChartData> {
    const response = await apiClient.get('/analytics/users', { params: { period } });
    return response.data;
  },

  async getTopPodcasts(limit: number = 10): Promise<TopPodcast[]> {
    const response = await apiClient.get('/analytics/top-podcasts', { params: { limit } });
    return response.data;
  },

  async getCategoryDistribution(): Promise<{ category: string; count: number }[]> {
    const response = await apiClient.get('/analytics/categories');
    return response.data;
  },
};

// Legacy export for backwards compatibility
export const analyticService = analyticsService;
