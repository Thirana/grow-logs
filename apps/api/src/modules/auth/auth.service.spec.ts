import { ConflictException } from '@nestjs/common';
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
}));
import * as bcrypt from 'bcrypt';

const MOCK_HASH = '$2b$12$mockhashfortesting';
const VALID_DTO = { email: 'user@example.com', password: 'SecurePass1!' };
const CREATED_USER = { id: 'user-uuid', email: 'user@example.com' };

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

    (bcrypt.hash as jest.Mock).mockResolvedValue(MOCK_HASH);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(CREATED_USER);
    mockJwtService.sign.mockReturnValue('mock-verification-token');
  });

  describe('register', () => {
    it('returns a success message when registration succeeds', async () => {
      const result = await service.register(VALID_DTO);

      expect(result.message).toBe(
        'Registration successful. Please check your email to verify your account.',
      );
    });

    it('checks for an existing user by email before creating', async () => {
      await service.register(VALID_DTO);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: VALID_DTO.email },
        select: { id: true },
      });
    });

    it('stores a bcrypt hash, never the plain password', async () => {
      await service.register(VALID_DTO);

      const [createArg] = mockPrisma.user.create.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(createArg.data['passwordHash']).toBe(MOCK_HASH);
      expect(createArg.data['passwordHash']).not.toBe(VALID_DTO.password);
      expect(createArg.data['password']).toBeUndefined();
    });

    it('signs the verification token with sub and purpose claims and 24h expiry', async () => {
      await service.register(VALID_DTO);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: CREATED_USER.id, purpose: 'email-verification' },
        { expiresIn: '24h' },
      );
    });

    it('dispatches a verification email to the registered address', async () => {
      await service.register(VALID_DTO);

      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        CREATED_USER.email,
        'mock-verification-token',
      );
    });

    it('throws ConflictException when the email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-uuid' });

      await expect(service.register(VALID_DTO)).rejects.toThrow(
        ConflictException,
      );
    });

    it('does not create a user or send an email on duplicate registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-uuid' });

      await expect(service.register(VALID_DTO)).rejects.toThrow();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
