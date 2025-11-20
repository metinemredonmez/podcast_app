import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DownloadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  episodeId: string;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiProperty()
  status: string; // pending, completed, failed

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  episode?: {
    id: string;
    title: string;
    slug: string;
    duration: number;
    audioUrl: string;
    podcast?: {
      id: string;
      title: string;
      slug: string;
      coverImageUrl?: string;
    };
  };
}
