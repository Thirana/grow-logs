import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService } from './feature-flags.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const DB_FLAGS = [
  {
    id: 'flag-1',
    key: 'ai_weekly_summary',
    enabled: false,
    description: 'AI weekly digest',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'flag-2',
    key: 'stripe_billing',
    enabled: false,
    description: 'Stripe billing',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPrisma = {
  featureFlag: {
    findMany: jest.fn(),
  },
};

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(FeatureFlagsService);
    jest.resetAllMocks();
  });

  describe('onModuleInit', () => {
    it('primes the cache on startup', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValueOnce(DB_FLAGS);

      await service.onModuleInit();

      expect(mockPrisma.featureFlag.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAll', () => {
    it('returns flags from the database on first call', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValueOnce(DB_FLAGS);

      const result = await service.getAll();

      expect(result).toEqual([
        { key: 'ai_weekly_summary', enabled: false },
        { key: 'stripe_billing', enabled: false },
      ]);
      expect(mockPrisma.featureFlag.findMany).toHaveBeenCalledTimes(1);
    });

    it('serves from cache on second call within TTL — no second DB query', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValueOnce(DB_FLAGS);

      await service.getAll();
      await service.getAll();

      expect(mockPrisma.featureFlag.findMany).toHaveBeenCalledTimes(1);
    });

    it('refreshes the cache after TTL expires', async () => {
      mockPrisma.featureFlag.findMany
        .mockResolvedValueOnce(DB_FLAGS)
        .mockResolvedValueOnce(DB_FLAGS);

      await service.getAll();

      // Expire the cache by backdating cacheExpiresAt
      (service as unknown as { cacheExpiresAt: number }).cacheExpiresAt =
        Date.now() - 1;

      await service.getAll();

      expect(mockPrisma.featureFlag.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshCache', () => {
    it('clears the old cache and writes fresh data from DB', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValueOnce(DB_FLAGS);
      await service.getAll();

      const updated = [{ ...DB_FLAGS[0], enabled: true }, DB_FLAGS[1]];
      mockPrisma.featureFlag.findMany.mockResolvedValueOnce(updated);
      await service.refreshCache();

      // Next getAll should reflect updated data without another DB call
      const result = await service.getAll();
      expect(result.find((f) => f.key === 'ai_weekly_summary')?.enabled).toBe(
        true,
      );
    });

    it('sets cacheExpiresAt to roughly 60 seconds from now', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValueOnce(DB_FLAGS);

      const before = Date.now();
      await service.refreshCache();
      const after = Date.now();

      const expiresAt = (service as unknown as { cacheExpiresAt: number })
        .cacheExpiresAt;
      expect(expiresAt).toBeGreaterThanOrEqual(before + 60_000);
      expect(expiresAt).toBeLessThanOrEqual(after + 60_000);
    });
  });

  describe('isEnabled', () => {
    it('returns false for a disabled flag', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValueOnce(DB_FLAGS);

      const result = await service.isEnabled('ai_weekly_summary');

      expect(result).toBe(false);
    });

    it('returns true for an enabled flag', async () => {
      const enabled = [{ ...DB_FLAGS[0], enabled: true }, DB_FLAGS[1]];
      mockPrisma.featureFlag.findMany.mockResolvedValueOnce(enabled);

      const result = await service.isEnabled('ai_weekly_summary');

      expect(result).toBe(true);
    });

    it('returns false for an unknown flag key', async () => {
      mockPrisma.featureFlag.findMany.mockResolvedValueOnce(DB_FLAGS);

      const result = await service.isEnabled('nonexistent_flag');

      expect(result).toBe(false);
    });
  });
});
