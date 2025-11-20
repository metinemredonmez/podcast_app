import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002', required: false })
  podcastId?: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003', required: false })
  episodeId?: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ required: false })
  podcast?: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl?: string | null;
  };

  @ApiProperty({ required: false })
  episode?: {
    id: string;
    title: string;
    slug: string;
    duration: number;
    audioUrl: string;
    podcast?: {
      id: string;
      title: string;
    };
  };
}
