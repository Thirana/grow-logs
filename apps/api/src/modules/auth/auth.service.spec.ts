import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';

// bcrypt is a CJS module with non-configurable exports — jest.mock is the only
// reliable way to intercept it; jest hoists this call before any imports resolve
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

const MOCK_HASH = '$2b$12$mockhashfortesting';
const REGISTER_DTO = { email: 'user@example.com', password: 'SecurePass1!' };
const CREATED_USER = { id: 'user-uuid', email: 'user@example.com' };

const DB_USER = {
  id: 'user-uuid',
  email: 'user@example.com',
  passwordHash: MOCK_HASH,
  role: 'USER' as const,
  isEmailVerified: true,
  onboardingCompleted: false,
  subscriptionStatus: 'FREE' as const,
};

const LOGIN_DTO = { email: DB_USER.email, password: 'SecurePass1!' };

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(12),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(MOCK_HASH);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(CREATED_USER);
      mockJwtService.sign.mockReturnValue('mock-verification-token');
    });

    it('returns a success message when registration succeeds', async () => {
      const result = await service.register(REGISTER_DTO);

      expect(result.message).toBe(
        'Registration successful. Please check your email to verify your account.',
      );
    });

    it('checks for an existing user by email before creating', async () => {
      await service.register(REGISTER_DTO);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: REGISTER_DTO.email },
        select: { id: true },
      });
    });

    it('stores a bcrypt hash, never the plain password', async () => {
      await service.register(REGISTER_DTO);

      const [createArg] = mockPrisma.user.create.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(createArg.data['passwordHash']).toBe(MOCK_HASH);
      expect(createArg.data['passwordHash']).not.toBe(REGISTER_DTO.password);
      expect(createArg.data['password']).toBeUndefined();
    });

    it('signs the verification token with sub and purpose claims and 24h expiry', async () => {
      await service.register(REGISTER_DTO);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: CREATED_USER.id, purpose: 'email-verification' },
        { expiresIn: '24h' },
      );
    });

    it('dispatches a verification email to the registered address', async () => {
      await service.register(REGISTER_DTO);

      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        CREATED_USER.email,
        'mock-verification-token',
      );
    });

    it('throws ConflictException when the email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-uuid' });

      await expect(service.register(REGISTER_DTO)).rejects.toThrow(
        ConflictException,
      );
    });

    it('does not create a user or send an email on duplicate registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-uuid' });

      await expect(service.register(REGISTER_DTO)).rejects.toThrow();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(DB_USER);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mock-access-token');
    });

    it('returns an access token and user profile on valid credentials', async () => {
      const result = await service.login(LOGIN_DTO);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.user).toEqual({
        id: DB_USER.id,
        email: DB_USER.email,
        role: DB_USER.role,
        isEmailVerified: DB_USER.isEmailVerified,
        onboardingCompleted: DB_USER.onboardingCompleted,
        subscriptionStatus: DB_USER.subscriptionStatus,
      });
    });

    it('signs the access token with sub and role claims', async () => {
      await service.login(LOGIN_DTO);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: DB_USER.id,
        role: DB_USER.role,
      });
    });

    it('never includes passwordHash in the returned user profile', async () => {
      const result = await service.login(LOGIN_DTO);

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws UnauthorizedException with a generic message when email is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(LOGIN_DTO)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    });

    it('throws UnauthorizedException with a generic message when password is wrong', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(LOGIN_DTO)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    });

    it('returns the same error message for wrong email and wrong password (no enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      let notFoundMessage: string | undefined;
      try {
        await service.login(LOGIN_DTO);
      } catch (e) {
        notFoundMessage = (e as UnauthorizedException).message;
      }

      mockPrisma.user.findUnique.mockResolvedValue(DB_USER);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      let wrongPasswordMessage: string | undefined;
      try {
        await service.login(LOGIN_DTO);
      } catch (e) {
        wrongPasswordMessage = (e as UnauthorizedException).message;
      }

      expect(notFoundMessage).toBe(wrongPasswordMessage);
    });

    it('throws UnauthorizedException about email verification when password is correct but email is unverified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...DB_USER,
        isEmailVerified: false,
      });

      await expect(service.login(LOGIN_DTO)).rejects.toThrow(
        new UnauthorizedException(
          'Email not verified. Please check your inbox.',
        ),
      );
    });
  });
});
