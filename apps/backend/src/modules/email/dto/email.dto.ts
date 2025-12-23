import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsEmail,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum EmailProviderEnum {
  SMTP = 'SMTP',
  SES = 'SES',
  SENDGRID = 'SENDGRID',
}

// ==================== EMAIL CONFIG DTOs ====================

export class UpdateEmailConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ enum: EmailProviderEnum })
  @IsOptional()
  @IsEnum(EmailProviderEnum)
  provider?: EmailProviderEnum;

  // SMTP Settings
  @ApiPropertyOptional({ description: 'SMTP Host' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ description: 'SMTP Port', default: 587 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ description: 'SMTP Username' })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiPropertyOptional({ description: 'SMTP Password (will be encrypted)' })
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @ApiPropertyOptional({ description: 'Use SSL/TLS' })
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  // AWS SES Settings
  @ApiPropertyOptional({ description: 'AWS SES Region' })
  @IsOptional()
  @IsString()
  sesRegion?: string;

  @ApiPropertyOptional({ description: 'AWS SES Access Key' })
  @IsOptional()
  @IsString()
  sesAccessKey?: string;

  @ApiPropertyOptional({ description: 'AWS SES Secret Key (will be encrypted)' })
  @IsOptional()
  @IsString()
  sesSecretKey?: string;

  // SendGrid Settings
  @ApiPropertyOptional({ description: 'SendGrid API Key (will be encrypted)' })
  @IsOptional()
  @IsString()
  sendgridApiKey?: string;

  // Common Settings
  @ApiPropertyOptional({ description: 'From Email Address' })
  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @ApiPropertyOptional({ description: 'From Name' })
  @IsOptional()
  @IsString()
  fromName?: string;
}

export class EmailConfigResponseDto {
  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty({ enum: EmailProviderEnum })
  provider: EmailProviderEnum;

  // SMTP
  @ApiPropertyOptional()
  smtpHost: string | null;

  @ApiPropertyOptional()
  smtpPort: number | null;

  @ApiPropertyOptional()
  smtpUser: string | null;

  @ApiProperty({ description: 'Whether SMTP password is configured' })
  hasSmtpPassword: boolean;

  @ApiPropertyOptional()
  smtpSecure: boolean;

  // SES
  @ApiPropertyOptional()
  sesRegion: string | null;

  @ApiPropertyOptional()
  sesAccessKey: string | null;

  @ApiProperty({ description: 'Whether SES secret key is configured' })
  hasSesSecretKey: boolean;

  // SendGrid
  @ApiProperty({ description: 'Whether SendGrid API key is configured' })
  hasSendgridApiKey: boolean;

  // Common
  @ApiPropertyOptional()
  fromEmail: string | null;

  @ApiPropertyOptional()
  fromName: string | null;

  @ApiPropertyOptional()
  updatedAt: Date | null;
}

export class TestEmailDto {
  @ApiProperty({ description: 'Test email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Custom subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Custom message' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class TestEmailResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  messageId?: string;
}

// ==================== EMAIL LOGS DTOs ====================

export class EmailLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  toEmail: string;

  @ApiPropertyOptional()
  toName: string | null;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  provider: string;

  @ApiPropertyOptional()
  providerId: string | null;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  errorMsg: string | null;

  @ApiPropertyOptional()
  sentAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class EmailStatsDto {
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
