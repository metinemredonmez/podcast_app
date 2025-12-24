import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { GoogleAuthService } from './google-auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  GoogleTokenDto,
  SocialProvidersResponseDto,
  SocialConnectionResponseDto,
  AuthResponseDto,
} from './dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
}

@ApiTags('Social Auth')
@Controller('auth')
export class GoogleAuthController {
  private readonly logger = new Logger(GoogleAuthController.name);

  constructor(private readonly googleAuthService: GoogleAuthService) {}

  /**
   * Get available social providers (public)
   */
  @Public()
  @Get('social/providers')
  @ApiOperation({ summary: 'Get available social login providers' })
  @ApiResponse({ status: 200, type: SocialProvidersResponseDto })
  async getProviders(
    @Query('tenantId') tenantId?: string,
  ): Promise<SocialProvidersResponseDto> {
    return this.googleAuthService.getActiveProviders(tenantId);
  }

  /**
   * Initiate Google OAuth flow (redirect)
   */
  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google' })
  async googleAuth(
    @Query('tenantId') tenantId: string,
    @Query('redirect') redirect: string,
    @Res() res: Response,
  ) {
    // Encode redirect URL in state for callback
    const state = Buffer.from(JSON.stringify({ tenantId, redirect })).toString('base64');
    const authUrl = await this.googleAuthService.getGoogleAuthUrl(tenantId, state);
    return res.redirect(authUrl);
  }

  /**
   * Google OAuth callback
   */
  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    // Parse state to get tenant and redirect info
    let stateData = { tenantId: undefined as string | undefined, redirect: '/' };
    try {
      stateData = JSON.parse(Buffer.from(state || '', 'base64').toString());
    } catch {
      // Use defaults
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = stateData.redirect || '/';

    if (error) {
      this.logger.warn(`Google OAuth error: ${error}`);
      return res.redirect(`${frontendUrl}${redirectUrl}?error=google_auth_failed`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}${redirectUrl}?error=no_code`);
    }

    try {
      // Exchange code for tokens
      const tokens = await this.googleAuthService.getTokensFromCode(code, stateData.tenantId);

      // Verify ID token and get user info
      const googleUser = await this.googleAuthService.verifyIdToken(tokens.id_token);

      // Authenticate or register user
      const authResponse = await this.googleAuthService.authenticateWithGoogle(
        googleUser,
        stateData.tenantId,
      );

      // Redirect with tokens (using fragment for security)
      const params = new URLSearchParams({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      });

      return res.redirect(`${frontendUrl}${redirectUrl}?${params}`);
    } catch (err) {
      this.logger.error('Google OAuth callback failed', err);
      return res.redirect(`${frontendUrl}${redirectUrl}?error=auth_failed`);
    }
  }

  /**
   * Login/Register with Google ID token (for mobile/SPA)
   */
  @Public()
  @Post('google/token')
  @ApiOperation({ summary: 'Authenticate with Google ID token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async googleTokenAuth(
    @Body() dto: GoogleTokenDto,
    @Query('tenantId') tenantId?: string,
  ): Promise<AuthResponseDto> {
    const googleUser = await this.googleAuthService.verifyIdToken(dto.idToken);
    return this.googleAuthService.authenticateWithGoogle(googleUser, tenantId);
  }

  /**
   * Link Google account to current user
   */
  @Post('social/link/google')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Google account to current user' })
  @ApiResponse({ status: 200, type: SocialConnectionResponseDto })
  async linkGoogle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GoogleTokenDto,
  ): Promise<SocialConnectionResponseDto> {
    return this.googleAuthService.linkGoogleAccount(user.userId, dto.idToken);
  }

  /**
   * Unlink Google account from current user
   */
  @Delete('social/link/google')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink Google account from current user' })
  @ApiResponse({ status: 200 })
  async unlinkGoogle(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.googleAuthService.unlinkGoogleAccount(user.userId);
  }

  /**
   * Get current user's social connections
   */
  @Get('social/connections')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user social connections' })
  @ApiResponse({ status: 200, type: [SocialConnectionResponseDto] })
  async getConnections(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SocialConnectionResponseDto[]> {
    return this.googleAuthService.getUserConnections(user.userId);
  }
}
