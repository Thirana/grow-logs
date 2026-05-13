import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
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
});
