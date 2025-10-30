import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  totalPodcasts!: number;

  @ApiProperty()
  totalEpisodes!: number;

  @ApiProperty()
  totalStreams!: number;
}
