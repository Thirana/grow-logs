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
    update: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
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

  describe('verifyEmail', () => {
    const VALID_PAYLOAD = { sub: 'user-uuid', purpose: 'email-verification' };
    const UNVERIFIED_USER = { id: 'user-uuid', isEmailVerified: false };
    const VERIFIED_USER = { id: 'user-uuid', isEmailVerified: true };

    beforeEach(() => {
      mockJwtService.verify.mockReturnValue(VALID_PAYLOAD);
      mockPrisma.user.findUnique.mockResolvedValue(UNVERIFIED_USER);
      mockPrisma.user.update.mockResolvedValue({
        ...UNVERIFIED_USER,
        isEmailVerified: true,
      });
    });

    it('sets isEmailVerified to true and returns success message', async () => {
      const result = await service.verifyEmail('valid-token');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: UNVERIFIED_USER.id },
        data: { isEmailVerified: true },
      });
      expect(result.message).toBe(
        'Email verified successfully. You can now log in.',
      );
    });

    it('returns success silently when user is already verified (idempotent)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(VERIFIED_USER);

      const result = await service.verifyEmail('valid-token');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(result.message).toBe(
        'Email verified successfully. You can now log in.',
      );
    });

    it('returns success silently when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.verifyEmail('valid-token');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(result.message).toBe(
        'Email verified successfully. You can now log in.',
      );
    });

    it('throws UnauthorizedException when token signature is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(service.verifyEmail('tampered-token')).rejects.toThrow(
        new UnauthorizedException(
          'Verification link is invalid or expired. Please request a new one.',
        ),
      );
    });

    it('throws UnauthorizedException when token is expired', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(
        new UnauthorizedException(
          'Verification link is invalid or expired. Please request a new one.',
        ),
      );
    });

    it('throws UnauthorizedException when token purpose is not email-verification', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-uuid',
        purpose: 'access',
      });

      await expect(service.verifyEmail('wrong-purpose-token')).rejects.toThrow(
        new UnauthorizedException(
          'Verification link is invalid or expired. Please request a new one.',
        ),
      );
    });

    it('returns the same error message for invalid and expired tokens (no leaking)', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      let expiredMessage: string | undefined;
      try {
        await service.verifyEmail('expired-token');
      } catch (e) {
        expiredMessage = (e as UnauthorizedException).message;
      }

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });
      let invalidMessage: string | undefined;
      try {
        await service.verifyEmail('tampered-token');
      } catch (e) {
        invalidMessage = (e as UnauthorizedException).message;
      }

      expect(expiredMessage).toBe(invalidMessage);
    });
  });

  describe('resendVerification', () => {
    const UNVERIFIED_USER = {
      id: 'user-uuid',
      email: 'user@example.com',
      isEmailVerified: false,
    };
    const EXPECTED_RESPONSE = {
      message:
        'If your email is registered and unverified, a new verification email has been sent.',
    };

    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(UNVERIFIED_USER);
      mockJwtService.sign.mockReturnValue('mock-verification-token');
    });

    it('returns the same response regardless of outcome (prevents user enumeration)', async () => {
      const resultFound = await service.resendVerification('user@example.com');
      expect(resultFound).toEqual(EXPECTED_RESPONSE);

      mockPrisma.user.findUnique.mockResolvedValue(null);
      const resultNotFound = await service.resendVerification(
        'unknown@example.com',
      );
      expect(resultNotFound).toEqual(EXPECTED_RESPONSE);
    });

    it('generates a verification token and sends an email for an unverified user', async () => {
      await service.resendVerification('user@example.com');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: UNVERIFIED_USER.id, purpose: 'email-verification' },
        { expiresIn: '24h' },
      );
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        UNVERIFIED_USER.email,
        'mock-verification-token',
      );
    });

    it('does not send an email when user is already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...UNVERIFIED_USER,
        isEmailVerified: true,
      });

      await service.resendVerification('user@example.com');

      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('does not send an email when email address is not registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.resendVerification('unknown@example.com');

      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const CHANGE_DTO = {
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass1!',
    };
    const STORED_USER = { id: 'user-uuid', passwordHash: MOCK_HASH };
    const NEW_HASH = '$2b$12$newmockhashfortesting';

    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(STORED_USER);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(NEW_HASH);
    });

    it('updates the passwordHash and returns a success message', async () => {
      const result = await service.changePassword('user-uuid', CHANGE_DTO);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: STORED_USER.id },
        data: { passwordHash: NEW_HASH },
      });
      expect(result.message).toBe('Password changed successfully');
    });

    it('hashes the new password before storing — never stores plain text', async () => {
      await service.changePassword('user-uuid', CHANGE_DTO);

      const [updateArg] = mockPrisma.user.update.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(updateArg.data['passwordHash']).toBe(NEW_HASH);
      expect(updateArg.data['passwordHash']).not.toBe(CHANGE_DTO.newPassword);
    });

    it('uses the configured bcrypt cost factor when hashing', async () => {
      await service.changePassword('user-uuid', CHANGE_DTO);

      expect(bcrypt.hash).toHaveBeenCalledWith(CHANGE_DTO.newPassword, 12);
    });

    it('throws UnauthorizedException when the current password is wrong', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-uuid', CHANGE_DTO),
      ).rejects.toThrow(
        new UnauthorizedException('Current password is incorrect'),
      );
    });

    it('does not update the password when current password is wrong', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-uuid', CHANGE_DTO),
      ).rejects.toThrow();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the user no longer exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('user-uuid', CHANGE_DTO),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
