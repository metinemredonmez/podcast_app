import { ApiProperty } from '@nestjs/swagger';

export class HocaStatsDto {
  @ApiProperty()
  totalFollowers!: number;

  @ApiProperty()
  totalPodcasts!: number;

  @ApiProperty()
  totalEpisodes!: number;
}
