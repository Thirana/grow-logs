import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '@grow-logs/schemas';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';

/**
 * Handles user registration: duplicate check, password hashing,
 * user creation, verification token generation, and email dispatch.
 *
 * Used by AuthController on POST /v1/auth/register.
 * Every step assumes the caller is unauthenticated — no JWT guard applied here.
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

    this.emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }
}
