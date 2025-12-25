import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatorBroadcastDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  body!: string;

  @ApiPropertyOptional({ description: 'Image URL for rich notification' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Custom data payload' })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Limit broadcast to a specific podcast', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  podcastId?: string;
}
