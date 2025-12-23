import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { EncryptionService } from '../../common/encryption';
import {
  UpdateSocialAuthConfigDto,
  SocialAuthConfigResponseDto,
  TestConnectionResponseDto,
} from './dto';

interface DecryptedGoogleConfig {
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
}

@Injectable()
export class SocialAuthConfigService {
  private readonly logger = new Logger(SocialAuthConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  /**
   * Get social auth configuration (for admin - with masked secrets)
   */
  async getConfig(tenantId?: string): Promise<SocialAuthConfigResponseDto> {
    const config = await this.prisma.socialAuthConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (!config) {
      return {
        googleEnabled: false,
        googleClientId: null,
        googleConfigured: false,
        googleCallbackUrl: null,
        updatedAt: null,
      };
    }

    return {
      googleEnabled: config.googleEnabled,
      googleClientId: config.googleClientId,
      googleConfigured: !!(config.googleClientId && config.googleClientSecret),
      googleCallbackUrl: config.googleCallbackUrl,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update social auth configuration
   */
  async updateConfig(
    dto: UpdateSocialAuthConfigDto,
    tenantId?: string,
  ): Promise<SocialAuthConfigResponseDto> {
    const data: Record<string, unknown> = {};

    if (dto.googleEnabled !== undefined) {
      data.googleEnabled = dto.googleEnabled;
    }
    if (dto.googleClientId !== undefined) {
      data.googleClientId = dto.googleClientId || null;
    }
    if (dto.googleClientSecret) {
      // Encrypt the secret before storing
      data.googleClientSecret = this.encryption.encrypt(dto.googleClientSecret);
    }
    if (dto.googleCallbackUrl !== undefined) {
      data.googleCallbackUrl = dto.googleCallbackUrl || null;
    }

    // Upsert - create if not exists, update if exists
    const existingConfig = await this.prisma.socialAuthConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (existingConfig) {
      await this.prisma.socialAuthConfig.update({
        where: { id: existingConfig.id },
        data,
      });
    } else {
      await this.prisma.socialAuthConfig.create({
        data: {
          tenantId: tenantId || null,
          ...data,
        } as Parameters<typeof this.prisma.socialAuthConfig.create>[0]['data'],
      });
    }

    return this.getConfig(tenantId);
  }

  /**
   * Delete Google configuration
   */
  async deleteGoogleConfig(tenantId?: string): Promise<void> {
    const config = await this.prisma.socialAuthConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (config) {
      await this.prisma.socialAuthConfig.update({
        where: { id: config.id },
        data: {
          googleEnabled: false,
          googleClientId: null,
          googleClientSecret: null,
          googleCallbackUrl: null,
        },
      });
    }
  }

  /**
   * Get decrypted config (for internal service use)
   */
  async getDecryptedGoogleConfig(tenantId?: string): Promise<DecryptedGoogleConfig | null> {
    const config = await this.prisma.socialAuthConfig.findFirst({
      where: {
        tenantId: tenantId || null,
        googleEnabled: true,
      },
    });

    if (!config?.googleClientId || !config?.googleClientSecret) {
      return null;
    }

    try {
      return {
        googleClientId: config.googleClientId,
        googleClientSecret: this.encryption.decrypt(config.googleClientSecret),
        googleCallbackUrl:
          config.googleCallbackUrl ||
          `${process.env.API_URL || 'http://localhost:3000'}/api/auth/google/callback`,
      };
    } catch (error) {
      this.logger.error('Failed to decrypt Google config', error);
      return null;
    }
  }

  /**
   * Check if Google OAuth is enabled and configured
   */
  async isGoogleEnabled(tenantId?: string): Promise<boolean> {
    const config = await this.getDecryptedGoogleConfig(tenantId);
    return !!config;
  }

  /**
   * Test Google connection
   */
  async testGoogleConnection(tenantId?: string): Promise<TestConnectionResponseDto> {
    const config = await this.getDecryptedGoogleConfig(tenantId);

    if (!config) {
      return {
        success: false,
        message: 'Google OAuth yapılandırılmamış',
      };
    }

    try {
      // Test by fetching Google's OpenID configuration
      const response = await fetch(
        'https://accounts.google.com/.well-known/openid-configuration',
      );

      if (response.ok) {
        return {
          success: true,
          message: 'Google OAuth bağlantısı başarılı',
        };
      }

      return {
        success: false,
        message: 'Google OAuth endpoint\'ine erişilemiyor',
      };
    } catch (error) {
      this.logger.error('Google connection test failed', error);
      return {
        success: false,
        message: 'Google OAuth bağlantısı başarısız',
      };
    }
  }
}
