import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { EncryptionService } from '../../common/encryption';
import {
  UpdateEmailConfigDto,
  EmailConfigResponseDto,
  TestEmailResponseDto,
  EmailLogDto,
  EmailStatsDto,
  EmailProviderEnum,
} from './dto';
import * as nodemailer from 'nodemailer';

interface DecryptedSmtpCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  fromEmail: string;
  fromName: string;
}

@Injectable()
export class EmailConfigService {
  private readonly logger = new Logger(EmailConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  /**
   * Get Email configuration (for admin - with masked passwords)
   */
  async getConfig(tenantId?: string): Promise<EmailConfigResponseDto> {
    const config = await this.prisma.emailConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (!config) {
      return {
        isEnabled: false,
        provider: EmailProviderEnum.SMTP,
        smtpHost: null,
        smtpPort: 587,
        smtpUser: null,
        hasSmtpPassword: false,
        smtpSecure: false,
        sesRegion: null,
        sesAccessKey: null,
        hasSesSecretKey: false,
        hasSendgridApiKey: false,
        fromEmail: null,
        fromName: null,
        updatedAt: null,
      };
    }

    return {
      isEnabled: config.isEnabled,
      provider: config.provider as EmailProviderEnum,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser,
      hasSmtpPassword: !!config.smtpPassword,
      smtpSecure: config.smtpSecure,
      sesRegion: config.sesRegion,
      sesAccessKey: config.sesAccessKey,
      hasSesSecretKey: !!config.sesSecretKey,
      hasSendgridApiKey: !!config.sendgridApiKey,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update Email configuration
   */
  async updateConfig(
    dto: UpdateEmailConfigDto,
    tenantId?: string,
  ): Promise<EmailConfigResponseDto> {
    const data: Record<string, unknown> = {};

    if (dto.isEnabled !== undefined) {
      data.isEnabled = dto.isEnabled;
    }
    if (dto.provider !== undefined) {
      data.provider = dto.provider;
    }

    // SMTP fields
    if (dto.smtpHost !== undefined) {
      data.smtpHost = dto.smtpHost || null;
    }
    if (dto.smtpPort !== undefined) {
      data.smtpPort = dto.smtpPort;
    }
    if (dto.smtpUser !== undefined) {
      data.smtpUser = dto.smtpUser || null;
    }
    if (dto.smtpPassword) {
      data.smtpPassword = this.encryption.encrypt(dto.smtpPassword);
    }
    if (dto.smtpSecure !== undefined) {
      data.smtpSecure = dto.smtpSecure;
    }

    // SES fields
    if (dto.sesRegion !== undefined) {
      data.sesRegion = dto.sesRegion || null;
    }
    if (dto.sesAccessKey !== undefined) {
      data.sesAccessKey = dto.sesAccessKey || null;
    }
    if (dto.sesSecretKey) {
      data.sesSecretKey = this.encryption.encrypt(dto.sesSecretKey);
    }

    // SendGrid fields
    if (dto.sendgridApiKey) {
      data.sendgridApiKey = this.encryption.encrypt(dto.sendgridApiKey);
    }

    // Common fields
    if (dto.fromEmail !== undefined) {
      data.fromEmail = dto.fromEmail || null;
    }
    if (dto.fromName !== undefined) {
      data.fromName = dto.fromName || null;
    }

    const existingConfig = await this.prisma.emailConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (existingConfig) {
      await this.prisma.emailConfig.update({
        where: { id: existingConfig.id },
        data,
      });
    } else {
      await this.prisma.emailConfig.create({
        data: {
          tenantId: tenantId || null,
          ...data,
        } as Parameters<typeof this.prisma.emailConfig.create>[0]['data'],
      });
    }

    return this.getConfig(tenantId);
  }

  /**
   * Delete Email credentials
   */
  async deleteCredentials(tenantId?: string): Promise<void> {
    const config = await this.prisma.emailConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (config) {
      await this.prisma.emailConfig.update({
        where: { id: config.id },
        data: {
          isEnabled: false,
          smtpHost: null,
          smtpPort: 587,
          smtpUser: null,
          smtpPassword: null,
          smtpSecure: false,
          sesRegion: null,
          sesAccessKey: null,
          sesSecretKey: null,
          sendgridApiKey: null,
        },
      });
    }
  }

  /**
   * Get decrypted SMTP credentials (for internal service use)
   */
  async getSmtpCredentials(tenantId?: string): Promise<DecryptedSmtpCredentials | null> {
    const config = await this.prisma.emailConfig.findFirst({
      where: {
        tenantId: tenantId || null,
        isEnabled: true,
        provider: 'SMTP',
      },
    });

    if (!config?.smtpHost || !config?.smtpUser || !config?.smtpPassword) {
      return null;
    }

    try {
      return {
        host: config.smtpHost,
        port: config.smtpPort || 587,
        user: config.smtpUser,
        password: this.encryption.decrypt(config.smtpPassword),
        secure: config.smtpSecure,
        fromEmail: config.fromEmail || config.smtpUser,
        fromName: config.fromName || 'System',
      };
    } catch (error) {
      this.logger.error('Failed to decrypt Email config', error);
      return null;
    }
  }

  /**
   * Check if Email is enabled and configured
   */
  async isEnabled(tenantId?: string): Promise<boolean> {
    const config = await this.prisma.emailConfig.findFirst({
      where: {
        tenantId: tenantId || null,
        isEnabled: true,
      },
    });

    if (!config) return false;

    switch (config.provider) {
      case 'SMTP':
        return !!(config.smtpHost && config.smtpUser && config.smtpPassword);
      case 'SES':
        return !!(config.sesRegion && config.sesAccessKey && config.sesSecretKey);
      case 'SENDGRID':
        return !!config.sendgridApiKey;
      default:
        return false;
    }
  }

  /**
   * Test Email connection
   */
  async testConnection(tenantId?: string): Promise<TestEmailResponseDto> {
    const config = await this.prisma.emailConfig.findFirst({
      where: { tenantId: tenantId || null },
    });

    if (!config || !config.isEnabled) {
      return {
        success: false,
        message: 'Email yapılandırılmamış',
      };
    }

    if (config.provider === 'SMTP') {
      return this.testSmtpConnection(config);
    }

    // For SES and SendGrid, just verify credentials exist
    if (config.provider === 'SES') {
      if (!config.sesRegion || !config.sesAccessKey || !config.sesSecretKey) {
        return {
          success: false,
          message: 'AWS SES kimlik bilgileri eksik',
        };
      }
      return {
        success: true,
        message: 'AWS SES kimlik bilgileri yapılandırılmış',
      };
    }

    if (config.provider === 'SENDGRID') {
      if (!config.sendgridApiKey) {
        return {
          success: false,
          message: 'SendGrid API anahtarı eksik',
        };
      }
      return {
        success: true,
        message: 'SendGrid API anahtarı yapılandırılmış',
      };
    }

    return {
      success: false,
      message: 'Bilinmeyen provider',
    };
  }

  private async testSmtpConnection(config: {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPassword: string | null;
    smtpSecure: boolean;
  }): Promise<TestEmailResponseDto> {
    if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
      return {
        success: false,
        message: 'SMTP yapılandırması eksik',
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort || 587,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: this.encryption.decrypt(config.smtpPassword),
        },
      });

      await transporter.verify();

      return {
        success: true,
        message: 'SMTP bağlantısı başarılı',
      };
    } catch (error) {
      this.logger.error('SMTP connection test failed', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'SMTP bağlantı hatası',
      };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(
    email: string,
    subject?: string,
    customMessage?: string,
    tenantId?: string,
  ): Promise<TestEmailResponseDto> {
    const credentials = await this.getSmtpCredentials(tenantId);

    if (!credentials) {
      return {
        success: false,
        message: 'Email yapılandırılmamış',
      };
    }

    const emailSubject = subject || 'Test Email - Admin Panel';
    const message = customMessage || 'Bu bir test e-postasıdır. Email yapılandırması başarıyla çalışıyor.';

    try {
      const transporter = nodemailer.createTransport({
        host: credentials.host,
        port: credentials.port,
        secure: credentials.secure,
        auth: {
          user: credentials.user,
          pass: credentials.password,
        },
      });

      const result = await transporter.sendMail({
        from: `"${credentials.fromName}" <${credentials.fromEmail}>`,
        to: email,
        subject: emailSubject,
        text: message,
        html: `<p>${message}</p>`,
      });

      // Log the test email
      await this.prisma.emailLog.create({
        data: {
          tenantId,
          toEmail: email,
          subject: emailSubject,
          body: message,
          type: 'TEST',
          provider: 'SMTP',
          providerId: result.messageId,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Test e-postası gönderildi',
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error('Test email failed', error);

      // Log the failed email
      await this.prisma.emailLog.create({
        data: {
          tenantId,
          toEmail: email,
          subject: emailSubject,
          body: message,
          type: 'TEST',
          provider: 'SMTP',
          status: 'FAILED',
          errorMsg: error instanceof Error ? error.message : 'Bilinmeyen hata',
        },
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email gönderilemedi',
      };
    }
  }

  /**
   * Get Email logs
   */
  async getLogs(
    tenantId?: string,
    page = 1,
    limit = 20,
  ): Promise<{ logs: EmailLogDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where: { tenantId: tenantId || null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.emailLog.count({
        where: { tenantId: tenantId || null },
      }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        toEmail: log.toEmail,
        toName: log.toName,
        subject: log.subject,
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
   * Get Email statistics
   */
  async getStats(tenantId?: string): Promise<EmailStatsDto> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, last24h, last7d] = await Promise.all([
      this.prisma.emailLog.groupBy({
        by: ['status'],
        where: { tenantId: tenantId || null },
        _count: { status: true },
      }),
      this.prisma.emailLog.groupBy({
        by: ['status'],
        where: {
          tenantId: tenantId || null,
          createdAt: { gte: last24Hours },
        },
        _count: { status: true },
      }),
      this.prisma.emailLog.groupBy({
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
