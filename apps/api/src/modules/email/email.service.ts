import { Injectable, Logger } from '@nestjs/common';

/**
 * Dev-mode stub for transactional email delivery.
 * Logs the verification URL to the console instead of sending a real email.
 *
 * Used by AuthService during registration and email resend flows.
 * Replaced by the real AWS SES implementation in Phase 5 (Step 18).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  sendVerificationEmail(email: string, token: string): void {
    this.logger.log(
      `[DEV] Verify email: /v1/auth/verify-email?token=${token} (${email})`,
    );
  }
}
