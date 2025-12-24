import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infra/prisma.service';
import { SmsConfigService } from './sms-config.service';
import { NetGsmService } from './providers/netgsm.service';
import {
  SendOtpResponseDto,
  AuthProvidersResponseDto,
} from './dto';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
  };
}

@Injectable()
export class PhoneAuthService {
  private readonly logger = new Logger(PhoneAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsConfigService: SmsConfigService,
    private readonly netgsm: NetGsmService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get available authentication providers for login page
   */
  async getAuthProviders(tenantId?: string): Promise<AuthProvidersResponseDto> {
    const [smsConfig, socialConfig] = await Promise.all([
      this.prisma.smsConfig.findFirst({ where: { tenantId: tenantId || null } }),
      this.prisma.socialAuthConfig.findFirst({ where: { tenantId: tenantId || null } }),
    ]);

    // Check if phone auth is enabled (either NETGSM or Twilio)
    const netgsmEnabled =
      !!smsConfig?.netgsmUsercode &&
      !!smsConfig?.netgsmPassword &&
      !!smsConfig?.netgsmMsgHeader;

    const twilioEnabled =
      !!smsConfig?.twilioAccountSid &&
      !!smsConfig?.twilioAuthToken &&
      !!smsConfig?.twilioPhoneNumber;

    const phoneEnabled = smsConfig?.isEnabled && (netgsmEnabled || twilioEnabled);

    const googleEnabled =
      socialConfig?.googleEnabled &&
      !!socialConfig?.googleClientId &&
      !!socialConfig?.googleClientSecret;

    return {
      email: true, // Email login is always available
      google: {
        enabled: googleEnabled || false,
        clientId: googleEnabled ? socialConfig?.googleClientId || null : null,
      },
      phone: {
        enabled: phoneEnabled || false,
        codeLength: smsConfig?.otpLength || 6,
      },
    };
  }

  /**
   * Generate random OTP code
   */
  private generateOtp(length: number): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }

  /**
   * Send OTP for admin login
   */
  async sendOtp(phone: string, tenantId?: string): Promise<SendOtpResponseDto> {
    const credentials = await this.smsConfigService.getCredentials(tenantId);

    if (!credentials) {
      throw new BadRequestException('Telefon ile giriş aktif değil');
    }

    const normalizedPhone = this.netgsm.normalizePhone(phone);

    // Check if phone belongs to an admin/editor
    const user = await this.prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        role: { in: ['ADMIN', 'EDITOR'] },
        isActive: true,
      },
    });

    if (!user) {
      // Security: Return same error for any invalid phone
      throw new BadRequestException('Bu telefon numarası ile giriş yapılamaz');
    }

    const { settings } = credentials;

    // Rate limiting - check for recent OTP
    const lastOtp = await this.prisma.otpVerification.findFirst({
      where: {
        phone: normalizedPhone,
        type: 'ADMIN_LOGIN',
        createdAt: { gte: new Date(Date.now() - settings.resendCooldown * 1000) },
      },
    });

    if (lastOtp) {
      const waitTime = Math.ceil(
        (lastOtp.createdAt.getTime() + settings.resendCooldown * 1000 - Date.now()) / 1000,
      );
      throw new BadRequestException(`Lütfen ${waitTime} saniye bekleyin`);
    }

    // Delete old OTPs for this phone
    await this.prisma.otpVerification.deleteMany({
      where: { phone: normalizedPhone, type: 'ADMIN_LOGIN' },
    });

    // Generate new OTP
    const otp = this.generateOtp(settings.otpLength);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.otpVerification.create({
      data: {
        phone: normalizedPhone,
        code: hashedOtp,
        type: 'ADMIN_LOGIN',
        expiresAt: new Date(Date.now() + settings.otpExpiryMins * 60 * 1000),
      },
    });

    // Send SMS
    const message = `Admin Panel giriş kodunuz: ${otp}\n\nBu kod ${settings.otpExpiryMins} dakika geçerlidir.`;

    const result = await this.netgsm.sendSms(
      {
        usercode: credentials.usercode,
        password: credentials.password,
        msgHeader: credentials.msgHeader,
      },
      normalizedPhone,
      message,
    );

    // Log the SMS
    await this.prisma.smsLog.create({
      data: {
        tenantId,
        phone: normalizedPhone,
        message,
        type: 'OTP',
        provider: 'NETGSM',
        providerId: result.jobId,
        status: result.success ? 'SENT' : 'FAILED',
        errorMsg: result.error,
        sentAt: result.success ? new Date() : null,
      },
    });

    if (!result.success) {
      this.logger.error(`OTP SMS failed: ${result.error}`);
      throw new InternalServerErrorException('SMS gönderilemedi. Lütfen tekrar deneyin.');
    }

    return {
      success: true,
      message: 'Doğrulama kodu gönderildi',
      expiresIn: settings.otpExpiryMins * 60,
      resendAfter: settings.resendCooldown,
      maskedPhone: this.netgsm.maskPhone(phone),
      codeLength: settings.otpLength,
    };
  }

  /**
   * Verify OTP and login
   */
  async verifyOtpAndLogin(
    phone: string,
    code: string,
    tenantId?: string,
  ): Promise<AuthResponse> {
    const credentials = await this.smsConfigService.getCredentials(tenantId);

    if (!credentials) {
      throw new BadRequestException('Telefon ile giriş aktif değil');
    }

    const normalizedPhone = this.netgsm.normalizePhone(phone);
    const { settings } = credentials;

    // Find valid OTP
    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        phone: normalizedPhone,
        type: 'ADMIN_LOGIN',
        verified: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Kod bulunamadı veya süresi dolmuş');
    }

    // Check max attempts
    if (otpRecord.attempts >= settings.maxAttempts) {
      await this.prisma.otpVerification.delete({ where: { id: otpRecord.id } });
      throw new BadRequestException('Çok fazla hatalı deneme. Yeni kod isteyin.');
    }

    // Verify OTP
    const isValid = await bcrypt.compare(code, otpRecord.code);

    if (!isValid) {
      await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = settings.maxAttempts - otpRecord.attempts - 1;
      throw new BadRequestException(
        remaining > 0
          ? `Hatalı kod. ${remaining} deneme hakkınız kaldı.`
          : 'Hatalı kod. Yeni kod isteyin.',
      );
    }

    // Mark OTP as verified
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true, verifiedAt: new Date() },
    });

    // Find admin user
    const user = await this.prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        role: { in: ['ADMIN', 'EDITOR'] },
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Bu telefon ile giriş yapılamaz');
    }

    // Mark phone as verified if not already
    if (!user.phoneVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true, phoneVerifiedAt: new Date() },
      });
    }

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Generate JWT tokens
   */
  private async generateAuthResponse(user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    tenantId: string;
  }): Promise<AuthResponse> {
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
