import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailJob } from '../processors/email.processor';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private readonly attempts: number;

  constructor(
    @InjectQueue('email') private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {
    this.attempts = this.config.get<number>('queue.retryAttempts', { infer: true }) ?? 3;
  }

  async enqueue(payload: EmailJob): Promise<void> {
    this.logger.log(`Enqueuing email job: ${payload.type}`);
    await this.queue.add('email', payload, { attempts: this.attempts });
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    await this.enqueue({
      type: 'welcome',
      to,
      userName,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userName?: string): Promise<void> {
    await this.enqueue({
      type: 'password-reset',
      to,
      resetToken,
      userName,
    });
  }

  async sendEmailVerificationEmail(to: string, verificationToken: string, userName?: string): Promise<void> {
    await this.enqueue({
      type: 'email-verification',
      to,
      verificationToken,
      userName,
    });
  }

  async sendCustomEmail(
    to: string | string[],
    subject: string,
    html: string,
    options?: { text?: string; from?: string; replyTo?: string },
  ): Promise<void> {
    await this.enqueue({
      type: 'custom',
      to,
      subject,
      html,
      ...options,
    });
  }
}
