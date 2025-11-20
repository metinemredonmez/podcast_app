import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatorOverviewDto {
  @ApiProperty()
  totalPodcasts: number;

  @ApiProperty()
  totalEpisodes: number;

  @ApiProperty()
  totalPlays: number;

  @ApiProperty()
  totalFollowers: number;

  @ApiPropertyOptional()
  avgCompletionRate?: number;

  @ApiPropertyOptional()
  totalComments?: number;
}

export class PodcastAnalyticsDto {
  @ApiProperty()
  podcastId: string;

  @ApiProperty()
  podcastTitle: string;

  @ApiProperty()
  totalEpisodes: number;

  @ApiProperty()
  totalPlays: number;

  @ApiProperty()
  uniqueListeners: number;

  @ApiProperty()
  totalFollowers: number;

  @ApiPropertyOptional()
  avgCompletionRate?: number;

  @ApiProperty({ type: [Object] })
  playsOverTime: Array<{ date: string; count: number }>;

  @ApiProperty({ type: [Object] })
  topEpisodes: Array<{
    episodeId: string;
    title: string;
    plays: number;
    completionRate: number;
  }>;
}

export class EpisodeAnalyticsDto {
  @ApiProperty()
  episodeId: string;

  @ApiProperty()
  episodeTitle: string;

  @ApiProperty()
  totalPlays: number;

  @ApiProperty()
  uniqueListeners: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  avgListeningTime: number;

  @ApiProperty({ type: [Object] })
  playsOverTime: Array<{ date: string; count: number }>;

  @ApiPropertyOptional()
  totalComments?: number;
}
