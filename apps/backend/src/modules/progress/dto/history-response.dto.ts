import { ApiProperty } from '@nestjs/swagger';

export class HistoryEpisodeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  audioUrl: string;

  @ApiProperty({ required: false })
  coverImageUrl?: string;

  @ApiProperty()
  podcastId: string;

  @ApiProperty()
  podcastTitle: string;

  @ApiProperty()
  podcastSlug: string;
}

export class HistoryItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  episodeId: string;

  @ApiProperty()
  progressSeconds: number;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  progressPercentage: number;

  @ApiProperty()
  completed: boolean;

  @ApiProperty()
  lastPlayedAt: Date;

  @ApiProperty({ type: HistoryEpisodeDto })
  episode: HistoryEpisodeDto;
}

export class RecentlyPlayedResponseDto {
  @ApiProperty({ type: [HistoryItemDto] })
  items: HistoryItemDto[];

  @ApiProperty()
  total: number;
}

export class ContinueListeningResponseDto {
  @ApiProperty({ type: [HistoryItemDto] })
  items: HistoryItemDto[];

  @ApiProperty()
  total: number;
}

export class CompletedEpisodesResponseDto {
  @ApiProperty({ type: [HistoryItemDto] })
  items: HistoryItemDto[];

  @ApiProperty()
  total: number;
}
