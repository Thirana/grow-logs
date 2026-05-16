import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import { ChangePasswordDto, LoginDto, RegisterDto } from '@grow-logs/schemas';
import * as bcrypt from 'bcrypt';

interface EmailVerificationPayload {
  sub: string;
  purpose: string;
}
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';

export interface LoginResponseUser {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionStatus: SubscriptionStatus;
}

export interface LoginResponse {
  accessToken: string;
  user: LoginResponseUser;
}

/**
 * Handles user registration and login.
 * All methods assume the caller is unauthenticated — no JWT guard applied here.
 *
 * Used by AuthController on POST /api/v1/auth/register and POST /api/v1/auth/login.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const rounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash },
      select: { id: true, email: true },
    });

    // The purpose claim differentiates this token from access tokens.
    // verify-email (Step 16) must reject any token where purpose !== 'email-verification'.
    const verificationToken = this.jwtService.sign(
      { sub: user.id, purpose: 'email-verification' },
      { expiresIn: '24h' },
    );

    void this.emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isEmailVerified: true,
        onboardingCompleted: true,
        subscriptionStatus: true,
      },
    });

    // Password is checked before email verification so the error message
    // never reveals whether an email address has an account (user enumeration).
    // Wrong email and wrong password both return the same generic message.
    const passwordMatch =
      user !== null && (await bcrypt.compare(dto.password, user.passwordHash));

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verification check comes after password — only reached with correct credentials.
    // This way the verification hint is not leaked to someone guessing emails.
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please check your inbox.',
      );
    }

    // Access token carries sub, role, and subscriptionStatus so guards and
    // entry limit checks can operate without a DB lookup on every request.
    const accessToken = this.jwtService.sign({
      sub: user.id,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionStatus: user.subscriptionStatus,
      },
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    let payload: EmailVerificationPayload;

    try {
      payload = this.jwtService.verify<EmailVerificationPayload>(token);
    } catch {
      // Both expired and tampered tokens are unusable — same message for both
      // avoids leaking whether the token was valid but expired vs never valid.
      throw new UnauthorizedException(
        'Verification link is invalid or expired. Please request a new one.',
      );
    }

    if (payload.purpose !== 'email-verification') {
      throw new UnauthorizedException(
        'Verification link is invalid or expired. Please request a new one.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isEmailVerified: true },
    });

    // Return success silently if user is already verified or not found.
    // Idempotent: clicking the link twice should not produce an error.
    if (!user || user.isEmailVerified) {
      return { message: 'Email verified successfully. You can now log in.' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    // A missing user here means the JWT was valid but the account was deleted
    // mid-session. Treat as an auth failure rather than a 404 — no account info leaked.
    if (!user) {
      throw new UnauthorizedException();
    }

    const currentPasswordMatch = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!currentPasswordMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const rounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, rounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    // Always return the same response regardless of outcome to prevent
    // user enumeration — an attacker must not be able to tell whether
    // an email address has an account.
    const RESPONSE = {
      message:
        'If your email is registered and unverified, a new verification email has been sent.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isEmailVerified: true },
    });

    if (!user || user.isEmailVerified) {
      return RESPONSE;
    }

    const verificationToken = this.jwtService.sign(
      { sub: user.id, purpose: 'email-verification' },
      { expiresIn: '24h' },
    );

    void this.emailService.sendVerificationEmail(user.email, verificationToken);

    return RESPONSE;
  }
}
