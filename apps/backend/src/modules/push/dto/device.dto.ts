import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DevicePlatform } from '@prisma/client';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Device push token from platform' })
  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  @ApiProperty({ enum: DevicePlatform, description: 'Device platform' })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @ApiPropertyOptional({ description: 'Device name/model' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @ApiPropertyOptional({ description: 'App version' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  appVersion?: string;

  @ApiPropertyOptional({ description: 'OS version' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  osVersion?: string;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional({ description: 'Device push token' })
  @IsOptional()
  @IsString()
  deviceToken?: string;

  @ApiPropertyOptional({ description: 'Device name/model' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @ApiPropertyOptional({ description: 'App version' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  appVersion?: string;

  @ApiPropertyOptional({ description: 'OS version' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  osVersion?: string;

  @ApiPropertyOptional({ description: 'Is device active' })
  @IsOptional()
  isActive?: boolean;
}

export class DeviceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceToken: string;

  @ApiProperty({ enum: DevicePlatform })
  platform: DevicePlatform;

  @ApiPropertyOptional()
  deviceName?: string | null;

  @ApiPropertyOptional()
  appVersion?: string | null;

  @ApiPropertyOptional()
  osVersion?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  lastActiveAt: Date;

  @ApiProperty()
  createdAt: Date;
}
