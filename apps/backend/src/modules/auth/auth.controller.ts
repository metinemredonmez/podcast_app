import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ThrottleAuth } from '../../common/decorators/throttle.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload, RefreshPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @ThrottleAuth()
  @Post('register')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests. Max 5 requests per 5 minutes.' })
  register(@Body() payload: RegisterDto): Promise<AuthResponseDto> {
    return this.service.register(payload);
  }

  @Public()
  @ThrottleAuth()
  @Post('login')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests. Max 5 requests per 5 minutes.' })
  login(@Body() payload: LoginDto): Promise<AuthResponseDto> {
    return this.service.login(payload);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@CurrentUser() user: RefreshPayload, @Body() payload: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshToken = payload?.refreshToken ?? user.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required.');
    }
    return this.service.refreshTokens({ refreshToken });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async logout(@CurrentUser() user: JwtPayload): Promise<{ success: boolean }> {
    await this.service.logout(user.sub, user.tenantId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: AuthUserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@CurrentUser() user: JwtPayload): Promise<AuthUserDto> {
    return this.service.getProfile(user.sub, user.tenantId);
  }

  @Public()
  @ThrottleAuth()
  @Post('forgot-password')
  @ApiOkResponse({ description: 'Password reset email sent if account exists' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 429, description: 'Too many requests. Max 5 requests per 5 minutes.' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    return this.service.forgotPassword(dto);
  }

  @Public()
  @ThrottleAuth()
  @Post('verify-reset-token')
  @ApiOkResponse({ description: 'Token validity check' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  @ApiResponse({ status: 429, description: 'Too many requests. Max 5 requests per 5 minutes.' })
  verifyResetToken(@Body() dto: VerifyResetTokenDto): Promise<{ valid: boolean; email?: string }> {
    return this.service.verifyResetToken(dto);
  }

  @Public()
  @ThrottleAuth()
  @Post('reset-password')
  @ApiOkResponse({ description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many requests. Max 5 requests per 5 minutes.' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    return this.service.resetPassword(dto);
  }

  @Public()
  @Post('verify-email')
  @ApiOkResponse({ description: 'Email successfully verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ success: boolean; message: string }> {
    return this.service.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  @ApiOkResponse({ description: 'Verification email sent if account exists' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  resendVerification(@Body() dto: ResendVerificationDto): Promise<{ success: boolean; message: string }> {
    return this.service.resendVerification(dto);
  }
}
