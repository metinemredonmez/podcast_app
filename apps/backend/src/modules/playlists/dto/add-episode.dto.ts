import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddEpisodeToPlaylistDto {
  @ApiProperty({ example: 'abc-123-def', description: 'Episode ID' })
  @IsNotEmpty()
  @IsString()
  episodeId: string;

  @ApiPropertyOptional({ example: 0, description: 'Order position in playlist', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
