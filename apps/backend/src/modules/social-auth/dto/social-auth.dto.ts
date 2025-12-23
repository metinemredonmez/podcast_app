import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

// ==================== CONFIG DTOs ====================

export class UpdateSocialAuthConfigDto {
  @ApiPropertyOptional({ description: 'Enable Google OAuth' })
  @IsOptional()
  @IsBoolean()
  googleEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Google OAuth Client ID' })
  @IsOptional()
  @IsString()
  googleClientId?: string;

  @ApiPropertyOptional({ description: 'Google OAuth Client Secret (will be encrypted)' })
  @IsOptional()
  @IsString()
  googleClientSecret?: string;

  @ApiPropertyOptional({ description: 'Google OAuth Callback URL' })
  @IsOptional()
  @IsString()
  googleCallbackUrl?: string;
}

export class SocialAuthConfigResponseDto {
  @ApiProperty()
  googleEnabled: boolean;

  @ApiPropertyOptional()
  googleClientId: string | null;

  @ApiProperty({ description: 'Whether Google OAuth is fully configured' })
  googleConfigured: boolean;

  @ApiPropertyOptional()
  googleCallbackUrl: string | null;

  @ApiPropertyOptional()
  updatedAt: Date | null;
}

export class TestConnectionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}

// ==================== AUTH DTOs ====================

export class GoogleTokenDto {
  @ApiProperty({ description: 'Google ID token from client' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class SocialProvidersResponseDto {
  @ApiProperty()
  google: {
    enabled: boolean;
    clientId: string | null;
  };
}

export class SocialConnectionResponseDto {
  @ApiProperty()
  provider: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  displayName: string | null;

  @ApiPropertyOptional()
  avatarUrl: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
  };
}
