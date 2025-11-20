import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlaylistDto {
  @ApiProperty({ example: 'My Favorite Podcasts', description: 'Playlist name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'A collection of my favorite podcast episodes', description: 'Playlist description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: false, description: 'Is playlist public', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg', description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverUrl?: string;
}
