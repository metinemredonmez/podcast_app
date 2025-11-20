import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProgressResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  tenantId: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty()
  @Expose()
  episodeId: string;

  @ApiProperty({ description: 'Progress in seconds' })
  @Expose()
  progressSeconds: number;

  @ApiProperty()
  @Expose()
  completed: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Episode details if included' })
  @Expose()
  episode?: {
    id: string;
    title: string;
    slug: string;
    duration: number;
    audioUrl: string;
    podcastId: string;
  };
}
