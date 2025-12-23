import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
  Length,
} from 'class-validator';

// ==================== PHONE AUTH DTOs ====================

export class SendOtpDto {
  @ApiProperty({ description: 'Turkish phone number', example: '05551234567' })
  @IsString()
  @Matches(/^(\+90|0)?[5][0-9]{9}$/, {
    message: 'Geçerli bir Türkiye telefon numarası girin (05XX XXX XX XX)',
  })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'Phone number' })
  @IsString()
  @Matches(/^(\+90|0)?[5][0-9]{9}$/)
  phone: string;

  @ApiProperty({ description: '6 digit OTP code' })
  @IsString()
  @Length(6, 6, { message: 'Doğrulama kodu 6 haneli olmalıdır' })
  code: string;
}

export class SendOtpResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ description: 'OTP expiry time in seconds' })
  expiresIn: number;

  @ApiProperty({ description: 'Wait time before resend in seconds' })
  resendAfter: number;

  @ApiProperty({ description: 'Masked phone number for display' })
  maskedPhone: string;

  @ApiProperty({ description: 'OTP code length' })
  codeLength: number;
}

// ==================== AUTH PROVIDERS DTO ====================

export class AuthProvidersResponseDto {
  @ApiProperty()
  email: boolean;

  @ApiProperty()
  google: {
    enabled: boolean;
    clientId: string | null;
  };

  @ApiProperty()
  phone: {
    enabled: boolean;
    codeLength: number;
  };
}

// ==================== SMS CONFIG DTOs ====================

export class UpdateSmsConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'NetGSM User Code' })
  @IsOptional()
  @IsString()
  netgsmUsercode?: string;

  @ApiPropertyOptional({ description: 'NetGSM Password (will be encrypted)' })
  @IsOptional()
  @IsString()
  netgsmPassword?: string;

  @ApiPropertyOptional({ description: 'NetGSM Message Header (Sender ID)' })
  @IsOptional()
  @IsString()
  netgsmMsgHeader?: string;

  @ApiPropertyOptional({ description: 'OTP code length', default: 6 })
  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(8)
  otpLength?: number;

  @ApiPropertyOptional({ description: 'OTP expiry time in minutes', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  otpExpiryMins?: number;

  @ApiPropertyOptional({ description: 'Max OTP verification attempts', default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number;

  @ApiPropertyOptional({ description: 'Cooldown between OTP resends in seconds', default: 60 })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(300)
  resendCooldown?: number;
}

export class SmsConfigResponseDto {
  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  provider: string;

  @ApiPropertyOptional()
  netgsmUsercode: string | null;

  @ApiProperty({ description: 'Whether NetGSM password is configured' })
  hasNetgsmPassword: boolean;

  @ApiPropertyOptional()
  netgsmMsgHeader: string | null;

  @ApiProperty()
  otpLength: number;

  @ApiProperty()
  otpExpiryMins: number;

  @ApiProperty()
  maxAttempts: number;

  @ApiProperty()
  resendCooldown: number;

  @ApiPropertyOptional()
  updatedAt: Date | null;
}

export class TestSmsDto {
  @ApiProperty({ description: 'Test phone number' })
  @IsString()
  @Matches(/^(\+90|0)?[5][0-9]{9}$/)
  phone: string;

  @ApiPropertyOptional({ description: 'Custom test message' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class TestSmsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  balance?: number;
}

export class SmsBalanceResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  balance?: number;

  @ApiPropertyOptional()
  error?: string;
}

// ==================== SMS LOGS DTOs ====================

export class SmsLogDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  message: string;

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

export class SmsStatsDto {
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
