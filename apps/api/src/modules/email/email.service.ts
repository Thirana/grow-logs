import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { Env } from '../../config/env.validation.js';
import {
  verificationEmailHtml,
  verificationEmailText,
} from './templates/verification-email.template.js';

/**
 * Transactional email delivery via Resend.
 * In development mode logs the verification URL to the console instead of sending.
 * Used by AuthService during registration and email resend flows.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly nodeEnv: string;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.nodeEnv = this.config.get('NODE_ENV', { infer: true });
    this.appUrl = this.config.get('APP_URL', { infer: true });
    this.fromAddress =
      this.config.get('RESEND_FROM_ADDRESS', { infer: true }) ?? '';
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true }) ?? '';
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.appUrl}/verify-email?token=${token}`;

    if (this.nodeEnv !== 'production') {
      this.logger.log(`[DEV] Verify email: ${verificationUrl} (${email})`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: `Grow Logs <${this.fromAddress}>`,
      to: [email],
      subject: 'Verify your Grow Logs account',
      html: verificationEmailHtml(verificationUrl),
      text: verificationEmailText(verificationUrl),
    });

    if (error) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }
}
