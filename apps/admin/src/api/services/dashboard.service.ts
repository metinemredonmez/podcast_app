import { apiClient } from '../client';

export interface DashboardStats {
  totalUsers: number;
  totalPodcasts: number;
  totalEpisodes: number;
  totalPlays: number;
  totalComments: number;
  totalFollows: number;
  usersByRole: { role: string; count: number }[];
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  }[];
  recentPodcasts: {
    id: string;
    title: string;
    owner: { name: string | null; email: string };
    episodeCount: number;
    createdAt: string;
  }[];
  growthMetrics: {
    usersGrowth: number;
    podcastsGrowth: number;
    episodesGrowth: number;
  };
}

export interface TopPodcast {
  id: string;
  title: string;
  coverImageUrl?: string;
  playCount: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  },

  async getTopPodcasts(limit = 5): Promise<TopPodcast[]> {
    const response = await apiClient.get('/analytics/top-podcasts', {
      params: { limit },
    });
    // Backend returns 'plays' but we use 'playCount' in frontend
    return response.data.map((p: any) => ({
      id: p.id,
      title: p.title,
      coverImageUrl: p.coverImageUrl,
      playCount: p.plays || 0,
    }));
  },
};
