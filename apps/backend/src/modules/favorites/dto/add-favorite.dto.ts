import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Podcast ID to favorite',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  podcastId?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Episode ID to favorite',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @ValidateIf((o) => !o.podcastId && !o.episodeId)
  @IsNotEmpty({ message: 'Either podcastId or episodeId must be provided' })
  _validator?: string;
}
