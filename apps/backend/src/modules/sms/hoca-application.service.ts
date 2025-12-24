import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infra/prisma.service';
import { SmsConfigService } from './sms-config.service';
import { NetGsmService } from './providers/netgsm.service';
import { TwilioService } from './providers/twilio.service';

interface SendCodeResult {
  success: boolean;
  message: string;
  expiresIn: number;
  resendAfter: number;
  maskedPhone: string;
  codeLength: number;
}

interface VerifyCodeResult {
  success: boolean;
  message: string;
  applicationToken?: string; // Token to proceed with application
}

interface ApplicationResult {
  success: boolean;
  message: string;
  applicationId?: string;
  status?: string;
}

interface ApplicationStatusResult {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
  reviewNotes?: string;
  rejectionReason?: string;
  canLogin?: boolean;
}

@Injectable()
export class HocaApplicationService {
  private readonly logger = new Logger(HocaApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsConfigService: SmsConfigService,
    private readonly netgsm: NetGsmService,
    private readonly twilio: TwilioService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
   * Normalize phone number
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) {
      normalized = '9' + normalized;
    } else if (normalized.startsWith('5')) {
      normalized = '90' + normalized;
    } else if (!normalized.startsWith('90')) {
      normalized = '90' + normalized;
    }
    return normalized;
  }

  /**
   * Mask phone for display
   */
  private maskPhone(phone: string): string {
    const n = this.normalizePhone(phone);
    if (n.length < 12) return phone;
    return `+90 ${n[2]}** *** **${n.slice(-2)}`;
  }

  /**
   * Send OTP for Hoca application
   */
  async sendVerificationCode(phone: string, tenantId: string): Promise<SendCodeResult> {
    const credentials = await this.smsConfigService.getCredentials(tenantId);

    if (!credentials) {
      throw new BadRequestException('SMS servisi aktif değil');
    }

    const normalizedPhone = this.normalizePhone(phone);
    const { settings, provider } = credentials;

    // Check if phone already has approved application or user
    const existingUser = await this.prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      throw new ConflictException('Bu telefon numarası zaten kayıtlı');
    }

    // Check for pending application
    const pendingApp = await this.prisma.hocaApplication.findFirst({
      where: {
        phone: normalizedPhone,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (pendingApp) {
      if (pendingApp.status === 'APPROVED') {
        throw new ConflictException('Başvurunuz onaylandı. Giriş yapabilirsiniz.');
      }
      throw new ConflictException('Bu numara ile bekleyen bir başvuru var');
    }

    // Rate limiting
    const lastOtp = await this.prisma.otpVerification.findFirst({
      where: {
        phone: normalizedPhone,
        type: 'PHONE_VERIFY',
        createdAt: { gte: new Date(Date.now() - settings.resendCooldown * 1000) },
      },
    });

    if (lastOtp) {
      const waitTime = Math.ceil(
        (lastOtp.createdAt.getTime() + settings.resendCooldown * 1000 - Date.now()) / 1000,
      );
      throw new BadRequestException(`Lütfen ${waitTime} saniye bekleyin`);
    }

    // Delete old OTPs
    await this.prisma.otpVerification.deleteMany({
      where: { phone: normalizedPhone, type: 'PHONE_VERIFY' },
    });

    // Generate OTP
    const otp = this.generateOtp(settings.otpLength);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.otpVerification.create({
      data: {
        phone: normalizedPhone,
        code: hashedOtp,
        type: 'PHONE_VERIFY',
        expiresAt: new Date(Date.now() + settings.otpExpiryMins * 60 * 1000),
      },
    });

    // Send SMS based on provider
    const message = `Hoca başvuru doğrulama kodunuz: ${otp}\n\nBu kod ${settings.otpExpiryMins} dakika geçerlidir.`;

    let result: { success: boolean; messageId?: string; jobId?: string; error?: string };

    if (provider === 'TWILIO' && credentials.twilioAccountSid) {
      result = await this.twilio.sendSms(
        {
          accountSid: credentials.twilioAccountSid,
          authToken: credentials.twilioAuthToken,
          fromNumber: credentials.twilioFromNumber,
        },
        normalizedPhone,
        message,
      );
    } else {
      result = await this.netgsm.sendSms(
        {
          usercode: credentials.usercode,
          password: credentials.password,
          msgHeader: credentials.msgHeader,
        },
        normalizedPhone,
        message,
      );
    }

    // Log SMS
    await this.prisma.smsLog.create({
      data: {
        tenantId,
        phone: normalizedPhone,
        message,
        type: 'OTP',
        provider: provider === 'TWILIO' ? 'TWILIO' : 'NETGSM',
        providerId: result.messageId || result.jobId,
        status: result.success ? 'SENT' : 'FAILED',
        errorMsg: result.error,
        sentAt: result.success ? new Date() : null,
      },
    });

    if (!result.success) {
      this.logger.error(`Verification SMS failed: ${result.error}`);
      throw new BadRequestException('SMS gönderilemedi. Lütfen tekrar deneyin.');
    }

    return {
      success: true,
      message: 'Doğrulama kodu gönderildi',
      expiresIn: settings.otpExpiryMins * 60,
      resendAfter: settings.resendCooldown,
      maskedPhone: this.maskPhone(phone),
      codeLength: settings.otpLength,
    };
  }

  /**
   * Verify OTP code
   */
  async verifyCode(phone: string, code: string, tenantId: string): Promise<VerifyCodeResult> {
    const credentials = await this.smsConfigService.getCredentials(tenantId);

    if (!credentials) {
      throw new BadRequestException('SMS servisi aktif değil');
    }

    const normalizedPhone = this.normalizePhone(phone);
    const { settings } = credentials;

    // Find valid OTP
    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        phone: normalizedPhone,
        type: 'PHONE_VERIFY',
        verified: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Kod bulunamadı veya süresi dolmuş');
    }

    if (otpRecord.attempts >= settings.maxAttempts) {
      await this.prisma.otpVerification.delete({ where: { id: otpRecord.id } });
      throw new BadRequestException('Çok fazla hatalı deneme. Yeni kod isteyin.');
    }

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

    // Mark as verified
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true, verifiedAt: new Date() },
    });

    // Generate application token (valid for 30 minutes)
    const applicationToken = this.jwtService.sign(
      { phone: normalizedPhone, type: 'hoca-application', tenantId },
      { expiresIn: '30m' },
    );

    return {
      success: true,
      message: 'Telefon numarası doğrulandı',
      applicationToken,
    };
  }

  /**
   * Submit Hoca application
   */
  async submitApplication(
    applicationToken: string,
    data: {
      name: string;
      email?: string;
      bio?: string;
      expertise?: string;
      organization?: string;
      position?: string;
    },
  ): Promise<ApplicationResult> {
    // Verify token
    let payload: { phone: string; tenantId: string; type: string };
    try {
      payload = this.jwtService.verify(applicationToken);
    } catch {
      throw new BadRequestException('Geçersiz veya süresi dolmuş token. Lütfen tekrar başlayın.');
    }

    if (payload.type !== 'hoca-application') {
      throw new BadRequestException('Geçersiz token tipi');
    }

    const { phone, tenantId } = payload;

    // Check if application already exists
    const existing = await this.prisma.hocaApplication.findFirst({
      where: { phone },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new ConflictException('Bu numara ile bekleyen bir başvuru var');
      }
      if (existing.status === 'APPROVED') {
        throw new ConflictException('Başvurunuz zaten onaylandı');
      }
    }

    // Delete rejected applications for same phone
    await this.prisma.hocaApplication.deleteMany({
      where: { phone, status: 'REJECTED' },
    });

    // Create application
    const application = await this.prisma.hocaApplication.create({
      data: {
        tenantId,
        phone,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        name: data.name,
        email: data.email,
        bio: data.bio,
        expertise: data.expertise,
        organization: data.organization,
        position: data.position,
        status: 'PENDING',
      },
    });

    this.logger.log(`New Hoca application: ${application.id} - ${data.name}`);

    return {
      success: true,
      message: 'Başvurunuz alındı. Onay bekliyor.',
      applicationId: application.id,
      status: 'PENDING',
    };
  }

  /**
   * Check application status
   */
  async checkApplicationStatus(phone: string): Promise<ApplicationStatusResult> {
    const normalizedPhone = this.normalizePhone(phone);

    const application = await this.prisma.hocaApplication.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { createdAt: 'desc' },
    });

    if (!application) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    const statusMessages = {
      PENDING: 'Başvurunuz inceleniyor. Onay bekleniyor.',
      APPROVED: 'Başvurunuz onaylandı! Artık giriş yapabilirsiniz.',
      REJECTED: 'Başvurunuz reddedildi.',
    };

    return {
      status: application.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      message: statusMessages[application.status],
      reviewNotes: application.reviewNotes || undefined,
      rejectionReason: application.rejectionReason || undefined,
      canLogin: application.status === 'APPROVED',
    };
  }

  /**
   * Get all pending applications (for admin)
   */
  async getPendingApplications(tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.hocaApplication.findMany({
        where: { tenantId, status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.hocaApplication.count({
        where: { tenantId, status: 'PENDING' },
      }),
    ]);

    return { applications, total, page, limit };
  }

  /**
   * Approve application (for admin)
   */
  async approveApplication(
    applicationId: string,
    adminId: string,
    notes?: string,
  ): Promise<ApplicationResult> {
    const application = await this.prisma.hocaApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException('Bu başvuru zaten işlenmiş');
    }

    // Generate random password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create user and hoca in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          tenantId: application.tenantId,
          email: application.email || `${application.phone}@hoca.local`,
          passwordHash,
          name: application.name,
          role: 'HOCA',
          phone: application.phone,
          phoneVerified: true,
          phoneVerifiedAt: application.phoneVerifiedAt,
          bio: application.bio,
          isActive: true,
        },
      });

      // Create hoca profile
      await tx.hoca.create({
        data: {
          tenantId: application.tenantId,
          userId: user.id,
          name: application.name,
          bio: application.bio,
          expertise: application.expertise,
          socialLinks: application.socialLinks,
          isActive: true,
        },
      });

      // Update application
      await tx.hocaApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNotes: notes,
          userId: user.id,
        },
      });

      return user;
    });

    this.logger.log(`Application approved: ${applicationId} -> User: ${result.id}`);

    // TODO: Send SMS notification to user about approval

    return {
      success: true,
      message: 'Başvuru onaylandı',
      applicationId,
      status: 'APPROVED',
    };
  }

  /**
   * Reject application (for admin)
   */
  async rejectApplication(
    applicationId: string,
    adminId: string,
    reason: string,
  ): Promise<ApplicationResult> {
    const application = await this.prisma.hocaApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException('Bu başvuru zaten işlenmiş');
    }

    await this.prisma.hocaApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    this.logger.log(`Application rejected: ${applicationId}`);

    return {
      success: true,
      message: 'Başvuru reddedildi',
      applicationId,
      status: 'REJECTED',
    };
  }
}
