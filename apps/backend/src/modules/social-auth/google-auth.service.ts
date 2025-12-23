import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infra/prisma.service';
import { SocialAuthConfigService } from './social-auth-config.service';
import { SocialProvider, User } from '@prisma/client';
import {
  SocialProvidersResponseDto,
  SocialConnectionResponseDto,
  AuthResponseDto,
} from './dto';

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly socialAuthConfig: SocialAuthConfigService,
  ) {}

  /**
   * Get active social providers for public endpoint
   */
  async getActiveProviders(tenantId?: string): Promise<SocialProvidersResponseDto> {
    const config = await this.prisma.socialAuthConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    const googleEnabled =
      config?.googleEnabled && !!config?.googleClientId && !!config?.googleClientSecret;

    return {
      google: {
        enabled: googleEnabled || false,
        clientId: googleEnabled ? config?.googleClientId || null : null,
      },
    };
  }

  /**
   * Generate Google OAuth URL
   */
  async getGoogleAuthUrl(tenantId?: string, state?: string): Promise<string> {
    const config = await this.socialAuthConfig.getDecryptedGoogleConfig(tenantId);

    if (!config) {
      throw new BadRequestException('Google OAuth yapılandırılmamış');
    }

    const params = new URLSearchParams({
      client_id: config.googleClientId,
      redirect_uri: config.googleCallbackUrl,
      response_type: 'code',
      scope: 'email profile openid',
      access_type: 'offline',
      prompt: 'consent',
      state: state || '',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string, tenantId?: string): Promise<GoogleTokens> {
    const config = await this.socialAuthConfig.getDecryptedGoogleConfig(tenantId);

    if (!config) {
      throw new BadRequestException('Google OAuth yapılandırılmamış');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.googleCallbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Google token exchange failed: ${errorText}`);
      throw new UnauthorizedException('Google authentication failed');
    }

    return response.json() as Promise<GoogleTokens>;
  }

  /**
   * Verify and decode Google ID token
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    const data = await response.json();

    return {
      googleId: data.sub,
      email: data.email,
      emailVerified: data.email_verified === 'true',
      name: data.name || data.email.split('@')[0],
      picture: data.picture || '',
    };
  }

  /**
   * Authenticate with Google - handles login and registration
   */
  async authenticateWithGoogle(
    googleUser: GoogleUserInfo,
    tenantId?: string,
  ): Promise<AuthResponseDto> {
    // 1. Check if social connection exists
    const existingConnection = await this.prisma.socialConnection.findUnique({
      where: {
        provider_providerId: {
          provider: SocialProvider.GOOGLE,
          providerId: googleUser.googleId,
        },
      },
      include: { user: true },
    });

    if (existingConnection) {
      // Login existing user
      return this.generateAuthResponse(existingConnection.user);
    }

    // 2. Check if email is already registered
    const existingUser = await this.prisma.user.findFirst({
      where: { email: googleUser.email },
    });

    if (existingUser) {
      // Link Google to existing account and login
      await this.createSocialConnection(existingUser.id, googleUser);
      return this.generateAuthResponse(existingUser);
    }

    // 3. Get default tenant if not specified
    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultTenant) {
        throw new BadRequestException('No active tenant found');
      }
      targetTenantId = defaultTenant.id;
    }

    // 4. Create new user
    const newUser = await this.prisma.user.create({
      data: {
        tenantId: targetTenantId,
        email: googleUser.email,
        passwordHash: '', // No password for social login users
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        emailVerified: googleUser.emailVerified,
        role: 'LISTENER',
      },
    });

    await this.createSocialConnection(newUser.id, googleUser);
    return this.generateAuthResponse(newUser);
  }

  /**
   * Link Google account to existing user
   */
  async linkGoogleAccount(
    userId: string,
    idToken: string,
  ): Promise<SocialConnectionResponseDto> {
    const googleUser = await this.verifyIdToken(idToken);

    // Check if this Google account is already linked to another user
    const existingConnection = await this.prisma.socialConnection.findUnique({
      where: {
        provider_providerId: {
          provider: SocialProvider.GOOGLE,
          providerId: googleUser.googleId,
        },
      },
    });

    if (existingConnection) {
      throw new ConflictException('Bu Google hesabı başka bir kullanıcıya bağlı');
    }

    // Check if user already has a Google connection
    const userConnection = await this.prisma.socialConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: SocialProvider.GOOGLE,
        },
      },
    });

    if (userConnection) {
      throw new ConflictException('Hesabınıza zaten bir Google hesabı bağlı');
    }

    const connection = await this.createSocialConnection(userId, googleUser);

    return {
      provider: connection.provider,
      email: connection.email,
      displayName: connection.displayName,
      avatarUrl: connection.avatarUrl,
      createdAt: connection.createdAt,
    };
  }

  /**
   * Unlink Google account from user
   */
  async unlinkGoogleAccount(userId: string): Promise<void> {
    // Check if user has a password (they need an alternative login method)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new BadRequestException(
        'Google bağlantısını kaldırmak için önce şifre belirlemelisiniz',
      );
    }

    await this.prisma.socialConnection.delete({
      where: {
        userId_provider: {
          userId,
          provider: SocialProvider.GOOGLE,
        },
      },
    });
  }

  /**
   * Get user's social connections
   */
  async getUserConnections(userId: string): Promise<SocialConnectionResponseDto[]> {
    const connections = await this.prisma.socialConnection.findMany({
      where: { userId },
      select: {
        provider: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return connections;
  }

  /**
   * Create social connection record
   */
  private async createSocialConnection(
    userId: string,
    googleUser: GoogleUserInfo,
  ) {
    return this.prisma.socialConnection.create({
      data: {
        userId,
        provider: SocialProvider.GOOGLE,
        providerId: googleUser.googleId,
        email: googleUser.email,
        displayName: googleUser.name,
        avatarUrl: googleUser.picture,
      },
    });
  }

  /**
   * Generate JWT tokens and auth response
   */
  private async generateAuthResponse(user: User): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessTokenExpiry', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.refreshTokenExpiry', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }
}
