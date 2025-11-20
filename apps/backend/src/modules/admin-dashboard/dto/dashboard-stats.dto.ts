import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  totalPodcasts: number;

  @ApiProperty()
  totalEpisodes: number;

  @ApiProperty()
  totalPlays: number;

  @ApiProperty()
  totalComments: number;

  @ApiProperty()
  totalFollows: number;

  @ApiProperty({ type: [Object] })
  usersByRole: Array<{ role: string; count: number }>;

  @ApiProperty({ type: [Object] })
  recentUsers: Array<{
    id: string;
    name?: string;
    email: string;
    role: string;
    createdAt: Date;
  }>;

  @ApiProperty({ type: [Object] })
  recentPodcasts: Array<{
    id: string;
    title: string;
    owner?: { name?: string; email: string };
    episodeCount: number;
    createdAt: Date;
  }>;

  @ApiPropertyOptional({ type: [Object] })
  growthMetrics?: {
    usersGrowth: number; // percentage
    podcastsGrowth: number;
    episodesGrowth: number;
  };
}
