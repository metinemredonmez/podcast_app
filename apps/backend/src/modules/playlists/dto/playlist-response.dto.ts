import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaylistEpisodeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  episodeId: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  addedAt: Date;

  @ApiPropertyOptional()
  episode?: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    duration: number;
    audioUrl: string;
    publishedAt?: Date;
    podcast?: {
      id: string;
      title: string;
      slug: string;
      coverImageUrl?: string;
    };
  };
}

export class PlaylistResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiPropertyOptional()
  coverUrl?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [PlaylistEpisodeResponseDto] })
  episodes?: PlaylistEpisodeResponseDto[];

  @ApiPropertyOptional()
  episodeCount?: number;
}
