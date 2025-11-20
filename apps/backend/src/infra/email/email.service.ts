import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('email.resendApiKey') ?? process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Email sending will be simulated.');
    }

    this.resend = new Resend(apiKey || 'dummy-key');
    this.fromEmail = this.config.get<string>('email.fromEmail') ?? process.env.EMAIL_FROM ?? 'noreply@podcast.app';
    this.fromName = this.config.get<string>('email.fromName') ?? process.env.EMAIL_FROM_NAME ?? 'Podcast App';
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const from = options.from ?? `${this.fromName} <${this.fromEmail}>`;

    try {
      // If API key is not configured, simulate sending
      if (!this.config.get<string>('email.resendApiKey') && !process.env.RESEND_API_KEY) {
        this.logger.log(
          `[SIMULATED] Email sent to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
        );
        this.logger.debug(`Subject: ${options.subject}`);
        this.logger.debug(`From: ${from}`);
        return { success: true, messageId: 'simulated-' + Date.now() };
      }

      const result = await this.resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      if (result.error) {
        this.logger.error('Failed to send email via Resend', result.error);
        return { success: false, error: result.error.message };
      }

      this.logger.log(`Email sent successfully: ${result.data?.id}`);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      this.logger.error('Failed to send email', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const html = this.getWelcomeEmailTemplate(userName);
    const result = await this.sendEmail({
      to,
      subject: 'Welcome to Podcast App! 🎙️',
      html,
      text: `Welcome ${userName}! Thank you for joining Podcast App. Start exploring amazing podcasts today!`,
    });
    return result.success;
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userName?: string): Promise<boolean> {
    const html = this.getPasswordResetTemplate(resetToken, userName);
    const result = await this.sendEmail({
      to,
      subject: 'Reset Your Password - Podcast App',
      html,
      text: `Reset your password using this token: ${resetToken}`,
    });
    return result.success;
  }

  async sendEmailVerificationEmail(to: string, verificationToken: string, userName?: string): Promise<boolean> {
    const html = this.getEmailVerificationTemplate(verificationToken, userName);
    const result = await this.sendEmail({
      to,
      subject: 'Verify Your Email - Podcast App',
      html,
      text: `Verify your email using this token: ${verificationToken}`,
    });
    return result.success;
  }

  // Email Templates
  private getWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Podcast App</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎙️ Welcome to Podcast App!</h1>
          </div>

          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${userName || 'there'}! 👋</h2>

            <p style="font-size: 16px; color: #555;">
              We're thrilled to have you join our community of podcast enthusiasts!
            </p>

            <p style="font-size: 16px; color: #555;">
              With Podcast App, you can:
            </p>

            <ul style="font-size: 16px; color: #555; line-height: 1.8;">
              <li>🎧 Discover and listen to thousands of podcasts</li>
              <li>📱 Track your listening progress across devices</li>
              <li>❤️ Save your favorite episodes and podcasts</li>
              <li>💬 Engage with the community through comments</li>
              <li>📊 Create and manage your own podcasts (for creators)</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                Start Listening
              </a>
            </div>

            <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              If you have any questions, feel free to reach out to our support team.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Podcast App. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(resetToken: string, userName?: string): string {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/reset-password?token=${resetToken}`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
          </div>

          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${userName || 'there'}!</h2>

            <p style="font-size: 16px; color: #555;">
              We received a request to reset your password for your Podcast App account.
            </p>

            <p style="font-size: 16px; color: #555;">
              Click the button below to reset your password:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                Reset Password
              </a>
            </div>

            <p style="font-size: 14px; color: #888;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #667eea; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>

            <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              ⚠️ <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </p>

            <p style="font-size: 14px; color: #888;">
              If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Podcast App. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  private getEmailVerificationTemplate(verificationToken: string, userName?: string): string {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/verify-email?token=${verificationToken}`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✉️ Verify Your Email</h1>
          </div>

          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${userName || 'there'}!</h2>

            <p style="font-size: 16px; color: #555;">
              Thank you for signing up for Podcast App! Please verify your email address to complete your registration.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>

            <p style="font-size: 14px; color: #888;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #4facfe; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">
              ${verifyUrl}
            </p>

            <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              ⚠️ This verification link will expire in 24 hours.
            </p>

            <p style="font-size: 14px; color: #888;">
              If you didn't create an account, please ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Podcast App. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }
}
