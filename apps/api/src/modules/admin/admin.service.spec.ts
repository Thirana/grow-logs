import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserRole, SubscriptionStatus } from '@prisma/client';
import { AdminService } from './admin.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service.js';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  featureFlag: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockFeatureFlagsService = {
  refreshCache: jest.fn(),
};

const DB_USER = {
  id: 'user-1',
  email: 'user@example.com',
  role: UserRole.USER,
  isEmailVerified: true,
  subscriptionStatus: SubscriptionStatus.FREE,
  createdAt: new Date('2024-01-15T10:00:00.000Z'),
};

const DB_FLAG = {
  id: 'flag-1',
  key: 'ai_weekly_summary',
  enabled: false,
  updatedAt: new Date('2024-01-15T10:00:00.000Z'),
};

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FeatureFlagsService, useValue: mockFeatureFlagsService },
      ],
    }).compile();

    service = module.get(AdminService);
    jest.resetAllMocks();
  });

  // ─── getUsers ────────────────────────────────────────────────────────────────

  describe('getUsers', () => {
    it('returns paginated user list without sensitive fields', async () => {
      mockPrisma.user.findMany.mockResolvedValue([DB_USER]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.getUsers({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0]).toEqual(DB_USER);
      expect(result.items[0]).not.toHaveProperty('passwordHash');
      expect(result.items[0]).not.toHaveProperty('stripeCustomerId');
    });

    it('uses select to exclude passwordHash and stripeCustomerId', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.getUsers({ page: 1, limit: 20 });

      const findManyCalls = mockPrisma.user.findMany.mock.calls as Array<
        [{ select: Record<string, boolean> }]
      >;
      const findManyCall = findManyCalls[0][0];
      expect(findManyCall.select).toBeDefined();
      expect(findManyCall.select['passwordHash']).toBeUndefined();
      expect(findManyCall.select['stripeCustomerId']).toBeUndefined();
      expect(findManyCall.select['id']).toBe(true);
      expect(findManyCall.select['email']).toBe(true);
    });

    it('applies role filter when provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.getUsers({ page: 1, limit: 20, role: 'ADMIN' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'ADMIN' } }),
      );
      expect(mockPrisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'ADMIN' } }),
      );
    });

    it('applies subscriptionStatus filter when provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.getUsers({
        page: 1,
        limit: 20,
        subscriptionStatus: 'FREE',
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subscriptionStatus: 'FREE' },
        }),
      );
    });

    it('applies both filters together', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.getUsers({
        page: 1,
        limit: 20,
        role: 'USER',
        subscriptionStatus: 'ACTIVE',
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'USER', subscriptionStatus: 'ACTIVE' },
        }),
      );
    });

    it('calculates skip correctly for page 2', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.getUsers({ page: 2, limit: 20 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 }),
      );
    });

    it('runs findMany and count in parallel', async () => {
      mockPrisma.user.findMany.mockResolvedValue([DB_USER]);
      mockPrisma.user.count.mockResolvedValue(1);

      await service.getUsers({ page: 1, limit: 20 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.count).toHaveBeenCalledTimes(1);
    });
  });

  // ─── toggleFlag ──────────────────────────────────────────────────────────────

  describe('toggleFlag', () => {
    it('enables a flag, invalidates the cache, and returns updated flag', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({ id: DB_FLAG.id });
      mockPrisma.featureFlag.update.mockResolvedValue({
        key: DB_FLAG.key,
        enabled: true,
        updatedAt: DB_FLAG.updatedAt,
      });
      mockFeatureFlagsService.refreshCache.mockResolvedValue(undefined);

      const result = await service.toggleFlag('ai_weekly_summary', true);

      expect(mockPrisma.featureFlag.update).toHaveBeenCalledWith({
        where: { key: 'ai_weekly_summary' },
        data: { enabled: true },
        select: { key: true, enabled: true, updatedAt: true },
      });
      expect(mockFeatureFlagsService.refreshCache).toHaveBeenCalledTimes(1);
      expect(result.key).toBe('ai_weekly_summary');
      expect(result.enabled).toBe(true);
    });

    it('disables a flag and invalidates the cache', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({ id: DB_FLAG.id });
      mockPrisma.featureFlag.update.mockResolvedValue({
        key: DB_FLAG.key,
        enabled: false,
        updatedAt: DB_FLAG.updatedAt,
      });
      mockFeatureFlagsService.refreshCache.mockResolvedValue(undefined);

      const result = await service.toggleFlag('ai_weekly_summary', false);

      expect(result.enabled).toBe(false);
      expect(mockFeatureFlagsService.refreshCache).toHaveBeenCalledTimes(1);
    });

    it('throws 404 when flag key does not exist', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleFlag('nonexistent_flag', true),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.featureFlag.update).not.toHaveBeenCalled();
      expect(mockFeatureFlagsService.refreshCache).not.toHaveBeenCalled();
    });

    it('does not call refreshCache if the update never happens (flag not found)', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

      await expect(service.toggleFlag('bad_key', true)).rejects.toThrow();

      expect(mockFeatureFlagsService.refreshCache).not.toHaveBeenCalled();
    });
  });
});
