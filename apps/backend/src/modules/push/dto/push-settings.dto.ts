import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdatePushSettingsDto {
  @ApiPropertyOptional({ description: 'Enable/disable all push notifications' })
  @IsOptional()
  @IsBoolean()
  enablePush?: boolean;

  @ApiPropertyOptional({ description: 'New episode notifications' })
  @IsOptional()
  @IsBoolean()
  newEpisodes?: boolean;

  @ApiPropertyOptional({ description: 'Comment notifications' })
  @IsOptional()
  @IsBoolean()
  comments?: boolean;

  @ApiPropertyOptional({ description: 'Like notifications' })
  @IsOptional()
  @IsBoolean()
  likes?: boolean;

  @ApiPropertyOptional({ description: 'Follow notifications' })
  @IsOptional()
  @IsBoolean()
  follows?: boolean;

  @ApiPropertyOptional({ description: 'System update notifications' })
  @IsOptional()
  @IsBoolean()
  systemUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Marketing & promotional notifications' })
  @IsOptional()
  @IsBoolean()
  marketingPromotions?: boolean;

  @ApiPropertyOptional({ description: 'Enable quiet hours' })
  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Quiet hours start time (HH:mm format)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'quietHoursStart must be in HH:mm format' })
  quietHoursStart?: string;

  @ApiPropertyOptional({ description: 'Quiet hours end time (HH:mm format)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'quietHoursEnd must be in HH:mm format' })
  quietHoursEnd?: string;

  @ApiPropertyOptional({ description: 'User timezone (e.g., Europe/Istanbul)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}

export class PushSettingsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  enablePush: boolean;

  @ApiProperty()
  newEpisodes: boolean;

  @ApiProperty()
  comments: boolean;

  @ApiProperty()
  likes: boolean;

  @ApiProperty()
  follows: boolean;

  @ApiProperty()
  systemUpdates: boolean;

  @ApiProperty()
  marketingPromotions: boolean;

  @ApiProperty()
  quietHoursEnabled: boolean;

  @ApiPropertyOptional()
  quietHoursStart?: string | null;

  @ApiPropertyOptional()
  quietHoursEnd?: string | null;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  updatedAt: Date;
}
