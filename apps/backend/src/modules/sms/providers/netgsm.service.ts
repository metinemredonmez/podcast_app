import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface NetGsmCredentials {
  usercode: string;
  password: string;
  msgHeader: string;
}

interface SendSmsResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

interface BalanceResult {
  success: boolean;
  balance?: number;
  error?: string;
}

@Injectable()
export class NetGsmService {
  private readonly logger = new Logger(NetGsmService.name);
  private readonly baseUrl = 'https://api.netgsm.com.tr';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Normalize Turkish phone number to 90XXXXXXXXXX format
   */
  normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');

    // Handle different formats
    if (normalized.startsWith('0')) {
      // 05XX -> 905XX
      normalized = '9' + normalized;
    } else if (normalized.startsWith('5')) {
      // 5XX -> 905XX
      normalized = '90' + normalized;
    } else if (!normalized.startsWith('90')) {
      // Add 90 prefix if missing
      normalized = '90' + normalized;
    }

    return normalized;
  }

  /**
   * Mask phone number for display (e.g., +90 5** *** **45)
   */
  maskPhone(phone: string): string {
    const n = this.normalizePhone(phone);
    if (n.length < 12) return phone;
    return `+90 ${n[2]}** *** **${n.slice(-2)}`;
  }

  /**
   * Send SMS via NetGSM API
   */
  async sendSms(
    credentials: NetGsmCredentials,
    phone: string,
    message: string,
  ): Promise<SendSmsResult> {
    try {
      const normalizedPhone = this.normalizePhone(phone);

      // NetGSM XML API format
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dession=""/>
    <usercode>${credentials.usercode}</usercode>
    <password>${credentials.password}</password>
    <type>1:n</type>
    <msgheader>${credentials.msgHeader}</msgheader>
  </header>
  <body>
    <msg><![CDATA[${message}]]></msg>
    <no>${normalizedPhone}</no>
  </body>
</mainbody>`;

      this.logger.debug(`Sending SMS to ${this.maskPhone(phone)}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/sms/send/xml`, xml, {
          headers: { 'Content-Type': 'application/xml' },
          timeout: 30000,
        }),
      );

      const responseData = response.data as string;

      // NetGSM response codes
      // 00 = Success (followed by job ID)
      // 30 = Invalid username/password
      // 40 = Message header not defined
      // 50 = Insufficient balance
      // 51 = Invalid number
      // 70 = Invalid parameters

      if (responseData.startsWith('00')) {
        const jobId = responseData.split(' ')[1] || responseData.substring(2).trim();
        this.logger.log(`SMS sent successfully. Job ID: ${jobId}`);
        return { success: true, jobId };
      }

      const errorCode = responseData.substring(0, 2);
      const errors: Record<string, string> = {
        '30': 'Kullanıcı adı veya şifre hatalı',
        '40': 'Mesaj başlığı tanımlı değil',
        '50': 'Yetersiz bakiye',
        '51': 'Geçersiz telefon numarası',
        '60': 'Sunucu hatası',
        '70': 'Geçersiz parametreler',
        '80': 'Sorgu sınırı aşıldı',
        '85': 'Mükerrer gönderim',
      };

      const errorMessage = errors[errorCode] || `NetGSM hatası: ${responseData}`;
      this.logger.error(`SMS failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } catch (error: any) {
      this.logger.error(`SMS send error: ${error.message}`);
      return {
        success: false,
        error: error.response?.data || error.message || 'SMS gönderilemedi',
      };
    }
  }

  /**
   * Get NetGSM account balance
   */
  async getBalance(credentials: Omit<NetGsmCredentials, 'msgHeader'>): Promise<BalanceResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/balance/list/get`, {
          params: {
            usercode: credentials.usercode,
            password: credentials.password,
            stession: 1,
          },
          timeout: 15000,
        }),
      );

      const responseData = response.data as string;

      // Response format: 00 BALANCE or error code
      if (responseData.startsWith('00')) {
        const balance = parseFloat(responseData.split(' ')[1]) || 0;
        return { success: true, balance };
      }

      const errors: Record<string, string> = {
        '30': 'Kullanıcı adı veya şifre hatalı',
        '40': 'Hesap bulunamadı',
        '80': 'Sorgu sınırı aşıldı',
      };

      const errorCode = responseData.substring(0, 2);
      return { success: false, error: errors[errorCode] || responseData };
    } catch (error: any) {
      this.logger.error(`Balance check error: ${error.message}`);
      return {
        success: false,
        error: error.response?.data || error.message || 'Bakiye sorgulanamadı',
      };
    }
  }

  /**
   * Test SMS credentials (sends to API but with test flag)
   */
  async testCredentials(credentials: NetGsmCredentials): Promise<{ valid: boolean; message: string }> {
    try {
      // Try to get balance as credential test
      const balanceResult = await this.getBalance({
        usercode: credentials.usercode,
        password: credentials.password,
      });

      if (balanceResult.success) {
        return {
          valid: true,
          message: `Bağlantı başarılı. Bakiye: ${balanceResult.balance} SMS`,
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
}
