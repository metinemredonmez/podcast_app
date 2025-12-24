import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BalanceResult {
  success: boolean;
  balance?: number;
  currency?: string;
  error?: string;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: any = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Twilio client lazily
   */
  private async getClient(credentials: TwilioCredentials) {
    try {
      // Dynamic import to avoid issues if twilio package is not installed
      const twilio = await import('twilio');
      return twilio.default(credentials.accountSid, credentials.authToken);
    } catch (error: any) {
      this.logger.error('Failed to initialize Twilio client:', error.message);
      throw new Error('Twilio SDK not available');
    }
  }

  /**
   * Normalize phone number to E.164 format (+XXXXXXXXXXX)
   */
  normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');

    // Handle Turkish numbers
    if (normalized.startsWith('0')) {
      // 05XX -> +905XX
      normalized = '9' + normalized;
    } else if (normalized.startsWith('5') && normalized.length === 10) {
      // 5XX -> +905XX
      normalized = '90' + normalized;
    } else if (normalized.startsWith('90') && normalized.length === 12) {
      // Already correct format, just add +
    }

    return '+' + normalized;
  }

  /**
   * Mask phone number for display (e.g., +90 5** *** **45)
   */
  maskPhone(phone: string): string {
    const n = this.normalizePhone(phone).replace('+', '');
    if (n.length < 12) return phone;
    return `+90 ${n[2]}** *** **${n.slice(-2)}`;
  }

  /**
   * Send SMS via Twilio API
   */
  async sendSms(
    credentials: TwilioCredentials,
    phone: string,
    message: string,
  ): Promise<SendSmsResult> {
    try {
      const client = await this.getClient(credentials);
      const normalizedPhone = this.normalizePhone(phone);

      this.logger.debug(`Sending SMS to ${this.maskPhone(phone)}`);

      const result = await client.messages.create({
        body: message,
        from: credentials.fromNumber,
        to: normalizedPhone,
      });

      if (result.sid) {
        this.logger.log(`SMS sent successfully. SID: ${result.sid}`);
        return { success: true, messageId: result.sid };
      }

      return { success: false, error: 'SMS gönderilemedi' };
    } catch (error: any) {
      this.logger.error(`Twilio SMS error: ${error.message}`);

      // Map common Twilio error codes to Turkish messages
      const errorMessages: Record<number, string> = {
        20003: 'Yetkisiz erişim - API bilgilerini kontrol edin',
        21211: 'Geçersiz telefon numarası',
        21408: 'Bu numaraya SMS gönderilemez',
        21610: 'Bu numara SMS almayı engellemiş',
        21614: 'Geçersiz mobil numara',
        21608: 'Gönderici numarası doğrulanmamış',
        21211: 'Geçersiz alıcı numarası',
      };

      const errorCode = error.code || 0;
      const errorMessage = errorMessages[errorCode] || error.message || 'SMS gönderilemedi';

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get Twilio account balance
   */
  async getBalance(credentials: TwilioCredentials): Promise<BalanceResult> {
    try {
      const client = await this.getClient(credentials);
      const balance = await client.balance.fetch();

      return {
        success: true,
        balance: parseFloat(balance.balance),
        currency: balance.currency,
      };
    } catch (error: any) {
      this.logger.error(`Twilio balance check error: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Bakiye sorgulanamadı',
      };
    }
  }

  /**
   * Test Twilio credentials
   */
  async testCredentials(credentials: TwilioCredentials): Promise<{ valid: boolean; message: string }> {
    try {
      const balanceResult = await this.getBalance(credentials);

      if (balanceResult.success) {
        return {
          valid: true,
          message: `Bağlantı başarılı. Bakiye: ${balanceResult.currency} ${balanceResult.balance?.toFixed(2)}`,
        };
      }

      return {
        valid: false,
        message: balanceResult.error || 'Bağlantı doğrulanamadı',
      };
    } catch (error: any) {
      return {
        valid: false,
        message: error.message || 'Bağlantı testi başarısız',
      };
    }
  }

  /**
   * Verify a phone number using Twilio Verify service
   */
  async sendVerificationCode(
    credentials: TwilioCredentials & { verifyServiceSid: string },
    phone: string,
  ): Promise<SendSmsResult> {
    try {
      const client = await this.getClient(credentials);
      const normalizedPhone = this.normalizePhone(phone);

      const verification = await client.verify.v2
        .services(credentials.verifyServiceSid)
        .verifications.create({
          to: normalizedPhone,
          channel: 'sms',
        });

      if (verification.status === 'pending') {
        this.logger.log(`Verification sent to ${this.maskPhone(phone)}`);
        return { success: true, messageId: verification.sid };
      }

      return { success: false, error: 'Doğrulama kodu gönderilemedi' };
    } catch (error: any) {
      this.logger.error(`Twilio Verify error: ${error.message}`);
      return { success: false, error: error.message || 'Doğrulama kodu gönderilemedi' };
    }
  }

  /**
   * Check verification code using Twilio Verify service
   */
  async checkVerificationCode(
    credentials: TwilioCredentials & { verifyServiceSid: string },
    phone: string,
    code: string,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const client = await this.getClient(credentials);
      const normalizedPhone = this.normalizePhone(phone);

      const verificationCheck = await client.verify.v2
        .services(credentials.verifyServiceSid)
        .verificationChecks.create({
          to: normalizedPhone,
          code: code,
        });

      if (verificationCheck.status === 'approved') {
        this.logger.log(`Phone verified: ${this.maskPhone(phone)}`);
        return { valid: true };
      }

      return { valid: false, error: 'Geçersiz doğrulama kodu' };
    } catch (error: any) {
      this.logger.error(`Twilio verification check error: ${error.message}`);
      return { valid: false, error: error.message || 'Doğrulama başarısız' };
    }
  }
}
