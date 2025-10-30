import { ApiProperty } from '@nestjs/swagger';

export class EpisodeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  podcastId!: string;

  @ApiProperty({ nullable: true })
  hostId!: string | null;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  duration!: number;

  @ApiProperty()
  audioUrl!: string;

  @ApiProperty({ nullable: true })
  publishedAt!: Date | null;

  @ApiProperty()
  isPublished!: boolean;

  @ApiProperty({ nullable: true })
  episodeNumber!: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
