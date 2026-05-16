import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, SubscriptionStatus } from '@prisma/client';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import type { AdminUserItem } from './admin.service.js';

const mockService = {
  getUsers: jest.fn(),
  toggleFlag: jest.fn(),
};

const userItem: AdminUserItem = {
  id: 'user-1',
  email: 'user@example.com',
  role: UserRole.USER,
  isEmailVerified: true,
  subscriptionStatus: SubscriptionStatus.FREE,
  createdAt: new Date('2024-01-15T10:00:00.000Z'),
};

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockService }],
    }).compile();

    controller = module.get(AdminController);
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('delegates to service and wraps in paginated envelope', async () => {
      mockService.getUsers.mockResolvedValue({ items: [userItem], total: 1 });

      const result = await controller.getUsers({ page: 1, limit: 20 });

      expect(mockService.getUsers).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result.data).toEqual([userItem]);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('calculates totalPages correctly for multiple pages', async () => {
      mockService.getUsers.mockResolvedValue({ items: [], total: 45 });

      const result = await controller.getUsers({ page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(3);
    });

    it('passes filters through to the service', async () => {
      mockService.getUsers.mockResolvedValue({ items: [], total: 0 });

      await controller.getUsers({
        page: 2,
        limit: 10,
        role: 'ADMIN',
        subscriptionStatus: 'FREE',
      });

      expect(mockService.getUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        role: 'ADMIN',
        subscriptionStatus: 'FREE',
      });
    });
  });

  describe('toggleFlag', () => {
    it('delegates to service and wraps in data envelope', async () => {
      const flagResult = {
        key: 'ai_weekly_summary',
        enabled: true,
        updatedAt: new Date('2024-01-15T10:00:00.000Z'),
      };
      mockService.toggleFlag.mockResolvedValue(flagResult);

      const result = await controller.toggleFlag('ai_weekly_summary', {
        enabled: true,
      });

      expect(mockService.toggleFlag).toHaveBeenCalledWith(
        'ai_weekly_summary',
        true,
      );
      expect(result).toEqual({ data: flagResult, meta: {} });
    });

    it('passes the key and enabled value to the service', async () => {
      mockService.toggleFlag.mockResolvedValue({
        key: 'stripe_billing',
        enabled: false,
        updatedAt: new Date(),
      });

      await controller.toggleFlag('stripe_billing', { enabled: false });

      expect(mockService.toggleFlag).toHaveBeenCalledWith(
        'stripe_billing',
        false,
      );
    });
  });
});
