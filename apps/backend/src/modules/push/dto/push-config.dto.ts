import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PushProviderType } from '@prisma/client';

export class UpdatePushConfigDto {
  @ApiPropertyOptional({ enum: PushProviderType, description: 'Push provider type' })
  @IsOptional()
  @IsEnum(PushProviderType)
  provider?: PushProviderType;

  @ApiPropertyOptional({ description: 'Enable/disable push notifications' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  // OneSignal Config
  @ApiPropertyOptional({ description: 'OneSignal App ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  oneSignalAppId?: string;

  @ApiPropertyOptional({ description: 'OneSignal REST API Key (will be encrypted)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  oneSignalApiKey?: string;

  // Firebase Config
  @ApiPropertyOptional({ description: 'Firebase Project ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firebaseProjectId?: string;

  @ApiPropertyOptional({ description: 'Firebase Service Account JSON (will be encrypted)' })
  @IsOptional()
  @IsString()
  firebaseCredentials?: string;

  // Settings
  @ApiPropertyOptional({ description: 'Default notification title' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  defaultTitle?: string;

  @ApiPropertyOptional({ description: 'Default notification icon URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  defaultIcon?: string;

  @ApiPropertyOptional({ description: 'Default notification badge URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  defaultBadge?: string;

  @ApiPropertyOptional({ description: 'Rate limit per minute', minimum: 10, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(10000)
  rateLimitPerMinute?: number;
}

export class PushConfigResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PushProviderType })
  provider: PushProviderType;

  @ApiProperty()
  isEnabled: boolean;

  // OneSignal (masked)
  @ApiPropertyOptional({ description: 'OneSignal App ID' })
  oneSignalAppId?: string | null;

  @ApiProperty({ description: 'Whether OneSignal API Key is configured' })
  hasOneSignalApiKey: boolean;

  // Firebase (masked)
  @ApiPropertyOptional({ description: 'Firebase Project ID' })
  firebaseProjectId?: string | null;

  @ApiProperty({ description: 'Whether Firebase credentials are configured' })
  hasFirebaseCredentials: boolean;

  // Settings
  @ApiPropertyOptional()
  defaultTitle?: string | null;

  @ApiPropertyOptional()
  defaultIcon?: string | null;

  @ApiPropertyOptional()
  defaultBadge?: string | null;

  @ApiProperty()
  rateLimitPerMinute: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TestPushConfigDto {
  @ApiProperty({ description: 'Device token to send test notification' })
  @IsString()
  deviceToken: string;
}
