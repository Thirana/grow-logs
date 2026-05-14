import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

const mockProfile = {
  id: 'user-uuid',
  email: 'user@example.com',
  role: 'USER',
  isEmailVerified: true,
  onboardingCompleted: false,
  subscriptionStatus: 'FREE',
  subscriptionPlan: null,
  createdAt: new Date('2026-01-01'),
};

const mockUsersService = {
  findById: jest.fn(),
  updateEmail: jest.fn(),
};

const mockUser = { userId: 'user-uuid', role: 'USER' };

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get(UsersController);
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('returns the profile wrapped in the standard data envelope', async () => {
      mockUsersService.findById.mockResolvedValue(mockProfile);

      const result = await controller.getMe(mockUser);

      expect(mockUsersService.findById).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual({ data: mockProfile, meta: {} });
    });
  });

  describe('updateMe', () => {
    it('delegates to updateEmail and returns updated profile in envelope', async () => {
      const updated = { ...mockProfile, email: 'new@example.com' };
      mockUsersService.updateEmail.mockResolvedValue(updated);

      const result = await controller.updateMe(mockUser, {
        email: 'new@example.com',
      });

      expect(mockUsersService.updateEmail).toHaveBeenCalledWith('user-uuid', {
        email: 'new@example.com',
      });
      expect(result).toEqual({ data: updated, meta: {} });
    });
  });
});
