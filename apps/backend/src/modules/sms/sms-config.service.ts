import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { EncryptionService } from '../../common/encryption';
import { NetGsmService } from './providers/netgsm.service';
import { TwilioService } from './providers/twilio.service';
import {
  UpdateSmsConfigDto,
  SmsConfigResponseDto,
  TestSmsResponseDto,
  SmsBalanceResponseDto,
  SmsLogDto,
  SmsStatsDto,
} from './dto';

interface DecryptedCredentials {
  provider: 'NETGSM' | 'TWILIO';
  // NetGSM
  usercode: string;
  password: string;
  msgHeader: string;
  // Twilio
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
  twilioVerifyServiceSid?: string;
  // Settings
  settings: {
    otpLength: number;
    otpExpiryMins: number;
    maxAttempts: number;
    resendCooldown: number;
  };
}

@Injectable()
export class SmsConfigService {
  private readonly logger = new Logger(SmsConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly netgsm: NetGsmService,
    private readonly twilio: TwilioService,
  ) {}

  /**
   * Get SMS configuration (for admin - with masked password)
   * Falls back to environment variables if no database config exists
   */
  async getConfig(tenantId?: string): Promise<SmsConfigResponseDto> {
    const config = await this.prisma.smsConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (!config) {
      // Check for environment variables fallback
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;
      const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

      const netgsmUsercode = process.env.NETGSM_USERCODE;
      const netgsmPassword = process.env.NETGSM_PASSWORD;
      const netgsmMsgHeader = process.env.NETGSM_MSG_HEADER;

      const hasTwilio = !!(twilioAccountSid && twilioAuthToken && twilioFromNumber);
      const hasNetgsm = !!(netgsmUsercode && netgsmPassword && netgsmMsgHeader);

      if (hasTwilio) {
        return {
          isEnabled: true,
          provider: 'TWILIO',
          netgsmUsercode: null,
          hasNetgsmPassword: false,
          netgsmMsgHeader: null,
          twilioAccountSid,
          hasTwilioAuthToken: true,
          twilioFromNumber,
          twilioVerifyServiceSid: twilioVerifyServiceSid || null,
          otpLength: 6,
          otpExpiryMins: 5,
          maxAttempts: 3,
          resendCooldown: 60,
          updatedAt: null,
        };
      }

      if (hasNetgsm) {
        return {
          isEnabled: true,
          provider: 'NETGSM',
          netgsmUsercode,
          hasNetgsmPassword: true,
          netgsmMsgHeader,
          twilioAccountSid: null,
          hasTwilioAuthToken: false,
          twilioFromNumber: null,
          twilioVerifyServiceSid: null,
          otpLength: 6,
          otpExpiryMins: 5,
          maxAttempts: 3,
          resendCooldown: 60,
          updatedAt: null,
        };
      }

      // No configuration found
      return {
        isEnabled: false,
        provider: 'NETGSM',
        netgsmUsercode: null,
        hasNetgsmPassword: false,
        netgsmMsgHeader: null,
        twilioAccountSid: null,
        hasTwilioAuthToken: false,
        twilioFromNumber: null,
        twilioVerifyServiceSid: null,
        otpLength: 6,
        otpExpiryMins: 5,
        maxAttempts: 3,
        resendCooldown: 60,
        updatedAt: null,
      };
    }

    return {
      isEnabled: config.isEnabled,
      provider: config.provider,
      netgsmUsercode: config.netgsmUsercode,
      hasNetgsmPassword: !!config.netgsmPassword,
      netgsmMsgHeader: config.netgsmMsgHeader,
      twilioAccountSid: config.twilioAccountSid,
      hasTwilioAuthToken: !!config.twilioAuthToken,
      twilioFromNumber: config.twilioFromNumber,
      twilioVerifyServiceSid: config.twilioVerifyServiceSid,
      otpLength: config.otpLength,
      otpExpiryMins: config.otpExpiryMins,
      maxAttempts: config.maxAttempts,
      resendCooldown: config.resendCooldown,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update SMS configuration
   */
  async updateConfig(
    dto: UpdateSmsConfigDto,
    tenantId?: string,
  ): Promise<SmsConfigResponseDto> {
    const data: Record<string, unknown> = {};

    if (dto.isEnabled !== undefined) {
      data.isEnabled = dto.isEnabled;
    }
    if (dto.provider !== undefined) {
      data.provider = dto.provider;
    }
    // NetGSM fields
    if (dto.netgsmUsercode !== undefined) {
      data.netgsmUsercode = dto.netgsmUsercode || null;
    }
    if (dto.netgsmPassword) {
      data.netgsmPassword = this.encryption.encrypt(dto.netgsmPassword);
    }
    if (dto.netgsmMsgHeader !== undefined) {
      data.netgsmMsgHeader = dto.netgsmMsgHeader || null;
    }
    // Twilio fields
    if (dto.twilioAccountSid !== undefined) {
      data.twilioAccountSid = dto.twilioAccountSid || null;
    }
    if (dto.twilioAuthToken) {
      data.twilioAuthToken = this.encryption.encrypt(dto.twilioAuthToken);
    }
    if (dto.twilioFromNumber !== undefined) {
      data.twilioFromNumber = dto.twilioFromNumber || null;
    }
    if (dto.twilioVerifyServiceSid !== undefined) {
      data.twilioVerifyServiceSid = dto.twilioVerifyServiceSid || null;
    }
    // OTP settings
    if (dto.otpLength !== undefined) {
      data.otpLength = dto.otpLength;
    }
    if (dto.otpExpiryMins !== undefined) {
      data.otpExpiryMins = dto.otpExpiryMins;
    }
    if (dto.maxAttempts !== undefined) {
      data.maxAttempts = dto.maxAttempts;
    }
    if (dto.resendCooldown !== undefined) {
      data.resendCooldown = dto.resendCooldown;
    }

    const existingConfig = await this.prisma.smsConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (existingConfig) {
      await this.prisma.smsConfig.update({
        where: { id: existingConfig.id },
        data,
      });
    } else {
      await this.prisma.smsConfig.create({
        data: {
          tenantId: tenantId || null,
          ...data,
        } as Parameters<typeof this.prisma.smsConfig.create>[0]['data'],
      });
    }

    return this.getConfig(tenantId);
  }

  /**
   * Delete SMS credentials
   */
  async deleteCredentials(tenantId?: string): Promise<void> {
    const config = await this.prisma.smsConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (config) {
      await this.prisma.smsConfig.update({
        where: { id: config.id },
        data: {
          isEnabled: false,
          netgsmUsercode: null,
          netgsmPassword: null,
          netgsmMsgHeader: null,
          twilioAccountSid: null,
          twilioAuthToken: null,
          twilioFromNumber: null,
          twilioVerifyServiceSid: null,
        },
      });
    }
  }

  /**
   * Get decrypted credentials (for internal service use)
   * Falls back to environment variables if no database config exists or is disabled
   */
  async getCredentials(tenantId?: string): Promise<DecryptedCredentials | null> {
    // Always check environment variables first for simplicity
    const envCredentials = this.getCredentialsFromEnv();
    if (envCredentials) {
      return envCredentials;
    }

    // Then check database config
    const config = await this.prisma.smsConfig.findFirst({
      where: {
        OR: [
          { tenantId: tenantId || null },
          { tenantId: null },
          { tenantId: '' },
        ],
      },
      orderBy: { tenantId: 'desc' },
    });

    if (!config || !config.isEnabled) {
      return null;
    }

    const settings = {
      otpLength: config.otpLength,
      otpExpiryMins: config.otpExpiryMins,
      maxAttempts: config.maxAttempts,
      resendCooldown: config.resendCooldown,
    };

    try {
      // Twilio credentials
      if (config.provider === 'TWILIO') {
        if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioFromNumber) {
          return null;
        }
        return {
          provider: 'TWILIO',
          usercode: '',
          password: '',
          msgHeader: '',
          twilioAccountSid: config.twilioAccountSid,
          twilioAuthToken: this.encryption.decrypt(config.twilioAuthToken),
          twilioFromNumber: config.twilioFromNumber,
          twilioVerifyServiceSid: config.twilioVerifyServiceSid || undefined,
          settings,
        };
      }

      // NetGSM credentials (default)
      if (!config.netgsmUsercode || !config.netgsmPassword || !config.netgsmMsgHeader) {
        return null;
      }
      return {
        provider: 'NETGSM',
        usercode: config.netgsmUsercode,
        password: this.encryption.decrypt(config.netgsmPassword),
        msgHeader: config.netgsmMsgHeader,
        twilioAccountSid: '',
        twilioAuthToken: '',
        twilioFromNumber: '',
        settings,
      };
    } catch (error) {
      this.logger.error('Failed to decrypt SMS config', error);
      return null;
    }
  }

  /**
   * Check if SMS is enabled and configured
   */
  async isEnabled(tenantId?: string): Promise<boolean> {
    const credentials = await this.getCredentials(tenantId);
    return !!credentials;
  }

  /**
   * Test SMS connection
   */
  async testConnection(tenantId?: string): Promise<TestSmsResponseDto> {
    const credentials = await this.getCredentials(tenantId);

    if (!credentials) {
      return {
        success: false,
        message: 'SMS yapılandırılmamış',
      };
    }

    let result: { valid: boolean; message: string };

    if (credentials.provider === 'TWILIO') {
      result = await this.twilio.testCredentials({
        accountSid: credentials.twilioAccountSid,
        authToken: credentials.twilioAuthToken,
        fromNumber: credentials.twilioFromNumber,
      });
    } else {
      result = await this.netgsm.testCredentials({
        usercode: credentials.usercode,
        password: credentials.password,
        msgHeader: credentials.msgHeader,
      });
    }

    return {
      success: result.valid,
      message: result.message,
      balance: result.valid ? undefined : undefined,
    };
  }

  /**
   * Send test SMS
   */
  async sendTestSms(
    phone: string,
    customMessage?: string,
    tenantId?: string,
  ): Promise<TestSmsResponseDto> {
    const credentials = await this.getCredentials(tenantId);

    if (!credentials) {
      return {
        success: false,
        message: 'SMS yapılandırılmamış',
      };
    }

    const message = customMessage || 'Bu bir test mesajıdır. - Admin Panel';

    let result: { success: boolean; messageId?: string; jobId?: string; error?: string };
    let normalizedPhone: string;

    if (credentials.provider === 'TWILIO') {
      result = await this.twilio.sendSms(
        {
          accountSid: credentials.twilioAccountSid,
          authToken: credentials.twilioAuthToken,
          fromNumber: credentials.twilioFromNumber,
        },
        phone,
        message,
      );
      normalizedPhone = this.twilio.normalizePhone(phone);
    } else {
      result = await this.netgsm.sendSms(
        {
          usercode: credentials.usercode,
          password: credentials.password,
          msgHeader: credentials.msgHeader,
        },
        phone,
        message,
      );
      normalizedPhone = this.netgsm.normalizePhone(phone);
    }

    // Log the test SMS
    await this.prisma.smsLog.create({
      data: {
        tenantId: tenantId || null,
        phone: normalizedPhone,
        message,
        type: 'NOTIFICATION',
        provider: credentials.provider,
        providerId: result.messageId || result.jobId,
        status: result.success ? 'SENT' : 'FAILED',
        errorMsg: result.error,
        sentAt: result.success ? new Date() : null,
      },
    });

    return {
      success: result.success,
      message: result.success ? 'Test SMS gönderildi' : result.error || 'SMS gönderilemedi',
    };
  }

  /**
   * Get NetGSM account balance
   */
  async getBalance(tenantId?: string): Promise<SmsBalanceResponseDto> {
    const credentials = await this.getCredentials(tenantId);

    if (!credentials) {
      return {
        success: false,
        error: 'SMS yapılandırılmamış',
      };
    }

    return this.netgsm.getBalance({
      usercode: credentials.usercode,
      password: credentials.password,
    });
  }

  /**
   * Get SMS logs
   */
  async getLogs(
    tenantId?: string,
    page = 1,
    limit = 20,
  ): Promise<{ logs: SmsLogDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.smsLog.findMany({
        where: { tenantId: tenantId || null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.smsLog.count({
        where: { tenantId: tenantId || null },
      }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        phone: this.netgsm.maskPhone(log.phone),
        message: log.message.length > 100 ? log.message.substring(0, 100) + '...' : log.message,
        type: log.type,
        provider: log.provider,
        providerId: log.providerId,
        status: log.status,
        errorMsg: log.errorMsg,
        sentAt: log.sentAt,
        createdAt: log.createdAt,
      })),
      total,
    };
  }

  /**
   * Get credentials from environment variables (fallback)
   */
  private getCredentialsFromEnv(): DecryptedCredentials | null {
    const defaultSettings = {
      otpLength: 6,
      otpExpiryMins: 5,
      maxAttempts: 3,
      resendCooldown: 60,
    };

    // Check for Twilio env vars
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;
    const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
      this.logger.log('Using Twilio credentials from environment variables');
      return {
        provider: 'TWILIO',
        usercode: '',
        password: '',
        msgHeader: '',
        twilioAccountSid,
        twilioAuthToken,
        twilioFromNumber,
        twilioVerifyServiceSid: twilioVerifyServiceSid || undefined,
        settings: defaultSettings,
      };
    }

    // Check for NetGSM env vars
    const netgsmUsercode = process.env.NETGSM_USERCODE;
    const netgsmPassword = process.env.NETGSM_PASSWORD;
    const netgsmMsgHeader = process.env.NETGSM_MSG_HEADER;

    if (netgsmUsercode && netgsmPassword && netgsmMsgHeader) {
      this.logger.log('Using NetGSM credentials from environment variables');
      return {
        provider: 'NETGSM',
        usercode: netgsmUsercode,
        password: netgsmPassword,
        msgHeader: netgsmMsgHeader,
        twilioAccountSid: '',
        twilioAuthToken: '',
        twilioFromNumber: '',
        settings: defaultSettings,
      };
    }

    return null;
  }

  /**
   * Get SMS statistics
   */
  async getStats(tenantId?: string): Promise<SmsStatsDto> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, last24h, last7d] = await Promise.all([
      this.prisma.smsLog.groupBy({
        by: ['status'],
        where: { tenantId: tenantId || null },
        _count: { status: true },
      }),
      this.prisma.smsLog.groupBy({
        by: ['status'],
        where: {
          tenantId: tenantId || null,
          createdAt: { gte: last24Hours },
        },
        _count: { status: true },
      }),
      this.prisma.smsLog.groupBy({
        by: ['status'],
        where: {
          tenantId: tenantId || null,
          createdAt: { gte: last7Days },
        },
        _count: { status: true },
      }),
    ]);

    const countByStatus = (data: { status: string; _count: { status: number } }[]) => {
      return {
        sent: data.find((d) => d.status === 'SENT')?._count.status || 0,
        delivered: data.find((d) => d.status === 'DELIVERED')?._count.status || 0,
        failed: data.find((d) => d.status === 'FAILED')?._count.status || 0,
      };
    };

    const totalStats = countByStatus(total as any);
    const totalSent = totalStats.sent + totalStats.delivered;
    const deliveryRate = totalSent > 0
      ? Math.round((totalStats.delivered / totalSent) * 100)
      : 0;

    return {
      totalSent: totalSent + totalStats.failed,
      totalDelivered: totalStats.delivered,
      totalFailed: totalStats.failed,
      deliveryRate,
      last24Hours: countByStatus(last24h as any),
      last7Days: countByStatus(last7d as any),
    };
  }
}
