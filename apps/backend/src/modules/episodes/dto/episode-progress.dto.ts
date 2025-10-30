import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsUUID, Min } from 'class-validator';

export class EpisodeProgressDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  episodeId!: string;

  @ApiProperty({ description: 'Progress in seconds' })
  @IsInt()
  @Min(0)
  progressSeconds!: number;

  @ApiProperty({ description: 'Whether the episode is completed' })
  @IsBoolean()
  completed!: boolean;
}
