import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AuthResponseDto, AuthTokensDto, AuthUserDto } from './dto/auth-response.dto';
import { USERS_REPOSITORY, UsersRepository, UserModel } from '../users/repositories/users.repository';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';
import { EmailQueueService } from '../../jobs/queues/email.queue';
import { PrismaService } from '../../infra/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly passwordSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository,
    private readonly emailQueue: EmailQueueService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersRepository.findByEmail(dto.email, dto.tenantId);
    if (existing) {
      throw new ConflictException('Email already registered in this tenant.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.passwordSaltRounds);
    const user = await this.usersRepository.create({
      tenantId: dto.tenantId,
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role ?? UserRole.LISTENER,
    });

    // Send welcome email (fire and forget - don't block registration)
    this.emailQueue.sendWelcomeEmail(user.email, user.name ?? 'there').catch((error) => {
      this.logger.error('Failed to queue welcome email', error);
    });

    // Send email verification (fire and forget)
    this.createEmailVerificationToken(user.id, user.email, user.name ?? undefined).catch((error) => {
      this.logger.error('Failed to create verification token', error);
    });

    const tokens = await this.issueTokens(user);
    await this.saveRefreshTokenHash(user.id, user.tenantId, tokens.refreshToken);
    return { tokens, user: this.toAuthUser(user) };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email (without tenantId - will return first match)
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is disabled.');
    }

    const tokens = await this.issueTokens(user);
    await this.saveRefreshTokenHash(user.id, user.tenantId, tokens.refreshToken);
    return { tokens, user: this.toAuthUser(user) };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh token secret is not configured.');
    }
    const payload = await this.jwtService
      .verifyAsync<JwtPayload>(dto.refreshToken, { secret: refreshSecret })
      .catch(() => {
        throw new UnauthorizedException('Invalid refresh token.');
      });

    const user = await this.usersRepository.findById(payload.sub, payload.tenantId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (payload.sub !== user.id) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const tokenMatches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash ?? '');
    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const tokens = await this.issueTokens(user);
    await this.saveRefreshTokenHash(user.id, user.tenantId, tokens.refreshToken);
    return { tokens, user: this.toAuthUser(user) };
  }

  async logout(userId: string, tenantId: string): Promise<void> {
    await this.usersRepository.update(userId, tenantId, { refreshTokenHash: null });
  }

  async getProfile(userId: string, tenantId: string): Promise<AuthUserDto> {
    const user = await this.usersRepository.findById(userId, tenantId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return this.toAuthUser(user);
  }

  private async issueTokens(user: UserModel): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh token secret is not configured.');
    }
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.configService.get<string>('jwt.refreshTokenTtl', '7d'),
    });
    return { accessToken, refreshToken };
  }

  private async saveRefreshTokenHash(userId: string, tenantId: string, refreshToken: string): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, this.passwordSaltRounds);
    await this.usersRepository.update(userId, tenantId, { refreshTokenHash: hashed });
  }

  private toAuthUser(user: UserModel): AuthUserDto {
    return plainToInstance(AuthUserDto, {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
    });
  }

  // Password Reset Methods
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findByEmail(dto.email);

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    // Invalidate any existing unused tokens for this user
    await this.prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Generate a secure random token
    const token = randomBytes(32).toString('hex');

    // Create password reset record (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email (fire and forget)
    this.emailQueue.sendPasswordResetEmail(user.email, token, user.name ?? undefined).catch((error) => {
      this.logger.error('Failed to queue password reset email', error);
    });

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async verifyResetToken(dto: VerifyResetTokenDto): Promise<{ valid: boolean; email?: string }> {
    const resetRecord = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!resetRecord) {
      return { valid: false };
    }

    // Check if token is expired
    if (new Date() > resetRecord.expiresAt) {
      return { valid: false };
    }

    // Check if token was already used
    if (resetRecord.used) {
      return { valid: false };
    }

    return {
      valid: true,
      email: resetRecord.user.email,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    const resetRecord = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    // Check if token is expired
    if (new Date() > resetRecord.expiresAt) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    // Check if token was already used
    if (resetRecord.used) {
      throw new BadRequestException('Reset token has already been used.');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(dto.newPassword, this.passwordSaltRounds);

    // Update user password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          refreshTokenHash: null, // Invalidate all existing sessions
        },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }

  // Email Verification Methods
  async verifyEmail(dto: VerifyEmailDto): Promise<{ success: boolean; message: string }> {
    const verificationRecord = await this.prisma.emailVerification.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!verificationRecord) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    // Check if token is expired (24 hours)
    if (new Date() > verificationRecord.expiresAt) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    // Check if already verified
    if (verificationRecord.verified) {
      throw new BadRequestException('Email has already been verified.');
    }

    // Mark user as verified and update verification record
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationRecord.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerification.update({
        where: { id: verificationRecord.id },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      message: 'Email verified successfully! You can now use all features.',
    };
  }

  async resendVerification(dto: ResendVerificationDto): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findByEmail(dto.email);

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a verification link has been sent.',
      };
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: true,
        message: 'Email is already verified.',
      };
    }

    // Invalidate old verification tokens
    await this.prisma.emailVerification.updateMany({
      where: {
        userId: user.id,
        verified: false,
      },
      data: {
        verified: true, // Mark as used
        verifiedAt: new Date(),
      },
    });

    // Generate new token
    const token = randomBytes(32).toString('hex');

    // Create verification record (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send verification email (fire and forget)
    this.emailQueue.sendEmailVerificationEmail(user.email, token, user.name ?? undefined).catch((error) => {
      this.logger.error('Failed to queue verification email', error);
    });

    return {
      success: true,
      message: 'If the email exists, a verification link has been sent.',
    };
  }

  private async createEmailVerificationToken(userId: string, userEmail: string, userName?: string): Promise<void> {
    // Generate token
    const token = randomBytes(32).toString('hex');

    // Expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save to database
    await this.prisma.emailVerification.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    // Send email (fire and forget)
    this.emailQueue.sendEmailVerificationEmail(userEmail, token, userName).catch((error) => {
      this.logger.error('Failed to queue verification email', error);
    });
  }

  /**
   * Change password for authenticated user
   * Invalidates all existing sessions by clearing refresh token
   */
  async changePassword(
    userId: string,
    tenantId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findById(userId, tenantId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, this.passwordSaltRounds);

    // Update password and invalidate all sessions
    await this.usersRepository.update(userId, tenantId, {
      passwordHash,
      refreshTokenHash: null, // Force re-login on all devices
    });

    this.logger.log(`Password changed for user ${userId}`);

    return {
      success: true,
      message: 'Password changed successfully. Please login again.',
    };
  }
}
