import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from '../../infra/email/email.service';

export interface WelcomeEmailJob {
  type: 'welcome';
  to: string;
  userName: string;
}

export interface PasswordResetEmailJob {
  type: 'password-reset';
  to: string;
  resetToken: string;
  userName?: string;
}

export interface EmailVerificationJob {
  type: 'email-verification';
  to: string;
  verificationToken: string;
  userName?: string;
}

export interface CustomEmailJob {
  type: 'custom';
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export type EmailJob = WelcomeEmailJob | PasswordResetEmailJob | EmailVerificationJob | CustomEmailJob;

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJob>): Promise<void> {
    const { data } = job;

    this.logger.log(`Processing email job: ${data.type} for ${data.to}`);

    try {
      switch (data.type) {
        case 'welcome':
          await this.emailService.sendWelcomeEmail(data.to, data.userName);
          break;

        case 'password-reset':
          await this.emailService.sendPasswordResetEmail(data.to, data.resetToken, data.userName);
          break;

        case 'email-verification':
          await this.emailService.sendEmailVerificationEmail(data.to, data.verificationToken, data.userName);
          break;

        case 'custom':
          await this.emailService.sendEmail({
            to: data.to,
            subject: data.subject,
            html: data.html,
            text: data.text,
            from: data.from,
            replyTo: data.replyTo,
          });
          break;

        default:
          this.logger.warn(`Unknown email job type: ${(data as EmailJob).type}`);
      }

      this.logger.log(`Email sent successfully: ${data.type}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${data.type}`, error);
      throw error; // Re-throw to trigger retry
    }
  }
}
