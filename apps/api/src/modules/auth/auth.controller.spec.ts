import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
  changePassword: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('delegates to authService.register with the validated DTO', async () => {
      const dto = { email: 'user@example.com', password: 'SecurePass1!' };
      const expected = {
        message:
          'Registration successful. Please check your email to verify your account.',
      };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('delegates to authService.login with the validated DTO', async () => {
      const dto = { email: 'user@example.com', password: 'SecurePass1!' };
      const expected = {
        accessToken: 'mock-access-token',
        user: {
          id: 'user-uuid',
          email: 'user@example.com',
          role: 'USER',
          isEmailVerified: true,
          onboardingCompleted: false,
          subscriptionStatus: 'FREE',
        },
      };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('verifyEmail', () => {
    it('delegates to authService.verifyEmail with the token from the DTO', async () => {
      const dto = { token: 'valid-verification-token' };
      const expected = {
        message: 'Email verified successfully. You can now log in.',
      };
      mockAuthService.verifyEmail.mockResolvedValue(expected);

      const result = await controller.verifyEmail(dto);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(dto.token);
      expect(result).toEqual(expected);
    });
  });

  describe('resendVerification', () => {
    it('delegates to authService.resendVerification with the email from the DTO', async () => {
      const dto = { email: 'user@example.com' };
      const expected = {
        message:
          'If your email is registered and unverified, a new verification email has been sent.',
      };
      mockAuthService.resendVerification.mockResolvedValue(expected);

      const result = await controller.resendVerification(dto);

      expect(mockAuthService.resendVerification).toHaveBeenCalledWith(
        dto.email,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('changePassword', () => {
    it('delegates to authService.changePassword with userId from CurrentUser and the DTO', async () => {
      const user = { userId: 'user-uuid', role: 'USER' as const };
      const dto = { currentPassword: 'OldPass1!', newPassword: 'NewPass1!' };
      const expected = { message: 'Password changed successfully' };
      mockAuthService.changePassword.mockResolvedValue(expected);

      const result = await controller.changePassword(user, dto);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        user.userId,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });
});
