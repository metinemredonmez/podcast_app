import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PushTargetType } from '@prisma/client';

export class SendPushDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  body: string;

  @ApiPropertyOptional({ description: 'Image URL for rich notification' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Custom data payload' })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @ApiProperty({ enum: PushTargetType, description: 'Target type' })
  @IsEnum(PushTargetType)
  targetType: PushTargetType;

  @ApiPropertyOptional({ description: 'Target user IDs (for USER_IDS target)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiPropertyOptional({ description: 'Topic name (for TOPIC target)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  topic?: string;

  @ApiPropertyOptional({ description: 'Segment name (for SEGMENT target)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  segment?: string;

  @ApiPropertyOptional({ description: 'Schedule time (ISO date string)' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;
}

export class PushLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional()
  data?: Record<string, unknown> | null;

  @ApiProperty({ enum: PushTargetType })
  targetType: PushTargetType;

  @ApiProperty()
  targetIds: string[];

  @ApiProperty()
  totalRecipients: number;

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  failureCount: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  providerMsgId?: string | null;

  @ApiPropertyOptional()
  errorMessage?: string | null;

  @ApiPropertyOptional()
  sentAt?: Date | null;

  @ApiPropertyOptional()
  scheduledAt?: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class PushStatsResponseDto {
  @ApiProperty()
  totalSent: number;

  @ApiProperty()
  totalDelivered: number;

  @ApiProperty()
  totalFailed: number;

  @ApiProperty()
  deliveryRate: number;

  @ApiProperty()
  last24Hours: {
    sent: number;
    delivered: number;
    failed: number;
  };

  @ApiProperty()
  last7Days: {
    sent: number;
    delivered: number;
    failed: number;
  };
}
