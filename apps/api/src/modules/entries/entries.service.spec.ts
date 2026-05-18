import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EntryType, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EntriesService } from './entries.service.js';

const mockPrisma = {
  entry: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  subcategory: {
    findUnique: jest.fn(),
  },
};

const TODAY = new Date().toISOString().slice(0, 10);
const PAST_DATE = '2024-01-15';
const FUTURE_DATE = '9999-12-31';

const baseCategory = {
  id: 'cat-1',
  userId: 'user-1',
  isCompleted: false,
};

const baseSubcategory = {
  id: 'sub-1',
  categoryId: 'cat-1',
  isCompleted: false,
};

const baseEntry = {
  id: 'entry-1',
  userId: 'user-1',
  categoryId: 'cat-1',
  subcategoryId: null,
  type: EntryType.WORK,
  text: 'Implemented the service layer for entries module.',
  productivityScore: 8,
  entryDate: new Date(`${PAST_DATE}T00:00:00.000Z`),
  createdAt: new Date('2024-01-15T10:00:00.000Z'),
  updatedAt: new Date('2024-01-15T10:00:00.000Z'),
  category: { id: 'cat-1', name: 'Backend', color: '#69B598' },
  subcategory: null,
};

describe('EntriesService', () => {
  let service: EntriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(EntriesService);
    // resetAllMocks (not clearAllMocks) is required here because getSummary uses
    // mockResolvedValueOnce chains — clearAllMocks does not flush those queues,
    // so stale values from a previous test can bleed into the next one.
    jest.resetAllMocks();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated entries sorted by entryDate desc', async () => {
      mockPrisma.entry.findMany.mockResolvedValue([baseEntry]);
      mockPrisma.entry.count.mockResolvedValue(1);

      const result = await service.findAll('user-1', {
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.entry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          skip: 0,
          take: 10,
          orderBy: { entryDate: 'desc' },
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies type filter', async () => {
      mockPrisma.entry.findMany.mockResolvedValue([]);
      mockPrisma.entry.count.mockResolvedValue(0);

      await service.findAll('user-1', { page: 1, limit: 10, type: 'WORK' });

      expect(mockPrisma.entry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', type: 'WORK' },
        }),
      );
    });

    it('applies from and to date range filters', async () => {
      mockPrisma.entry.findMany.mockResolvedValue([]);
      mockPrisma.entry.count.mockResolvedValue(0);

      await service.findAll('user-1', {
        page: 1,
        limit: 10,
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(mockPrisma.entry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            entryDate: {
              gte: new Date('2024-01-01T00:00:00.000Z'),
              lte: new Date('2024-01-31T00:00:00.000Z'),
            },
          },
        }),
      );
    });

    it('calculates skip correctly for page 2', async () => {
      mockPrisma.entry.findMany.mockResolvedValue([]);
      mockPrisma.entry.count.mockResolvedValue(0);

      await service.findAll('user-1', { page: 2, limit: 5 });

      expect(mockPrisma.entry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      type: 'WORK' as const,
      text: 'Implemented the service layer for entries module.',
      categoryId: 'cat-1',
    };

    it('creates an entry and returns it with category name', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.entry.count.mockResolvedValue(0);
      mockPrisma.entry.create.mockResolvedValue(baseEntry);

      const result = await service.create(
        'user-1',
        SubscriptionStatus.FREE,
        dto,
      );

      expect(mockPrisma.entry.create).toHaveBeenCalled();
      expect(result.category.name).toBe('Backend');
    });

    it('defaults entryDate to today UTC when not provided', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.entry.count.mockResolvedValue(0);
      mockPrisma.entry.create.mockResolvedValue(baseEntry);

      await service.create('user-1', SubscriptionStatus.FREE, dto);

      const createCalls = mockPrisma.entry.create.mock.calls as Array<
        [{ data: { entryDate: Date } }]
      >;
      const storedDate = createCalls[0][0].data.entryDate;
      const storedDateStr = storedDate.toISOString().slice(0, 10);
      expect(storedDateStr).toBe(TODAY);
    });

    it('throws 422 when entryDate is in the future', async () => {
      await expect(
        service.create('user-1', SubscriptionStatus.FREE, {
          ...dto,
          entryDate: FUTURE_DATE,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws 404 when categoryId does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', SubscriptionStatus.FREE, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when category belongs to another user', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        userId: 'other-user',
      });

      await expect(
        service.create('user-1', SubscriptionStatus.FREE, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 422 when category is completed', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        isCompleted: true,
      });

      await expect(
        service.create('user-1', SubscriptionStatus.FREE, dto),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws 404 when subcategory does not belong to the category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSubcategory,
        categoryId: 'other-cat',
      });

      await expect(
        service.create('user-1', SubscriptionStatus.FREE, {
          ...dto,
          subcategoryId: 'sub-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 422 when subcategory is completed', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSubcategory,
        isCompleted: true,
      });

      await expect(
        service.create('user-1', SubscriptionStatus.FREE, {
          ...dto,
          subcategoryId: 'sub-1',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws 422 when free user has reached daily limit of 10', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.entry.count.mockResolvedValue(10);

      await expect(
        service.create('user-1', SubscriptionStatus.FREE, dto),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('creates entry when free user has exactly 9 entries on the date', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.entry.count.mockResolvedValue(9);
      mockPrisma.entry.create.mockResolvedValue(baseEntry);

      await expect(
        service.create('user-1', SubscriptionStatus.FREE, dto),
      ).resolves.toBeDefined();
    });

    it('skips daily limit check for non-FREE subscribers', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.entry.create.mockResolvedValue(baseEntry);

      await service.create('user-1', SubscriptionStatus.ACTIVE, dto);

      expect(mockPrisma.entry.count).not.toHaveBeenCalled();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the entry when found and owned', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue(baseEntry);

      const result = await service.findOne('user-1', 'entry-1');

      expect(result.id).toBe('entry-1');
    });

    it('throws 404 when entry does not exist', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'entry-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 when entry belongs to another user', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue({
        ...baseEntry,
        userId: 'other-user',
      });

      await expect(service.findOne('user-1', 'entry-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    const storedEntry = {
      id: 'entry-1',
      userId: 'user-1',
      categoryId: 'cat-1',
      subcategoryId: null,
    };

    it('updates text and returns the updated entry', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue(storedEntry);
      mockPrisma.entry.update.mockResolvedValue({
        ...baseEntry,
        text: 'Updated entry text for testing purposes.',
      });

      const result = await service.update('user-1', 'entry-1', {
        text: 'Updated entry text for testing purposes.',
      });

      expect(result.text).toBe('Updated entry text for testing purposes.');
    });

    it('throws 404 when entry does not exist', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'entry-1', { text: 'Updated text here.' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when entry belongs to another user', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue({
        ...storedEntry,
        userId: 'other-user',
      });

      await expect(
        service.update('user-1', 'entry-1', { text: 'Updated text here.' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 422 when entryDate is in the future', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue(storedEntry);

      await expect(
        service.update('user-1', 'entry-1', { entryDate: FUTURE_DATE }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws 422 when new category is completed', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue(storedEntry);
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-2',
        userId: 'user-1',
        isCompleted: true,
      });

      await expect(
        service.update('user-1', 'entry-1', { categoryId: 'cat-2' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('clears subcategoryId when category changes and subcategory does not belong to new category', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue({
        ...storedEntry,
        subcategoryId: 'sub-1',
      });
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-2',
        userId: 'user-1',
        isCompleted: false,
      });
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        id: 'sub-1',
        categoryId: 'cat-1', // belongs to old category, not cat-2
      });
      mockPrisma.entry.update.mockResolvedValue({
        ...baseEntry,
        subcategoryId: null,
        subcategory: null,
      });

      await service.update('user-1', 'entry-1', { categoryId: 'cat-2' });

      const updateCalls = mockPrisma.entry.update.mock.calls as Array<
        [{ data: { subcategoryId: string | null } }]
      >;
      expect(updateCalls[0][0].data.subcategoryId).toBeNull();
    });

    it('throws 422 when subcategoryId does not belong to effective category', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue(storedEntry);
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        id: 'sub-2',
        categoryId: 'cat-99', // wrong category
        isCompleted: false,
      });

      await expect(
        service.update('user-1', 'entry-1', { subcategoryId: 'sub-2' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws 422 when new subcategoryId is completed', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue(storedEntry);
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        id: 'sub-1',
        categoryId: 'cat-1',
        isCompleted: true,
      });

      await expect(
        service.update('user-1', 'entry-1', { subcategoryId: 'sub-1' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the entry and returns void', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue({
        id: 'entry-1',
        userId: 'user-1',
      });
      mockPrisma.entry.delete.mockResolvedValue(undefined);

      const result = await service.delete('user-1', 'entry-1');

      expect(mockPrisma.entry.delete).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
      });
      expect(result).toBeUndefined();
    });

    it('throws 404 when entry does not exist', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'entry-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 404 when entry belongs to another user', async () => {
      mockPrisma.entry.findUnique.mockResolvedValue({
        id: 'entry-1',
        userId: 'other-user',
      });

      await expect(service.delete('user-1', 'entry-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getSummary ───────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    // Helper: set up all 9 parallel DB mocks in the order Promise.all calls them.
    function setupSummaryMocks({
      aggregate = { _count: { id: 0 }, _avg: { productivityScore: null } },
      typeGrouped = [],
      byCategoryType = [],
      byCategoryAgg = [],
      byDayRaw = [],
      trendEntries = [],
      thisWeekCount = 0,
      lastWeekCount = 0,
      distinctDates = [],
      categories = [],
    }: {
      aggregate?: {
        _count: { id: number };
        _avg: { productivityScore: number | null };
      };
      typeGrouped?: { type: string; _count: { id: number } }[];
      byCategoryType?: {
        categoryId: string;
        type: string;
        _count: { id: number };
      }[];
      byCategoryAgg?: {
        categoryId: string;
        _count: { id: number };
        _avg: { productivityScore: number | null };
      }[];
      byDayRaw?: { entryDate: Date; type: string; _count: { id: number } }[];
      trendEntries?: { entryDate: Date; productivityScore: number | null }[];
      thisWeekCount?: number;
      lastWeekCount?: number;
      distinctDates?: { entryDate: Date }[];
      categories?: {
        id: string;
        name: string;
        color: string;
        isCompleted: boolean;
      }[];
    } = {}) {
      mockPrisma.entry.aggregate.mockResolvedValueOnce(aggregate);
      mockPrisma.entry.groupBy
        .mockResolvedValueOnce(typeGrouped)
        .mockResolvedValueOnce(byCategoryType)
        .mockResolvedValueOnce(byCategoryAgg)
        .mockResolvedValueOnce(byDayRaw);
      mockPrisma.entry.findMany
        .mockResolvedValueOnce(trendEntries)
        .mockResolvedValueOnce(distinctDates);
      mockPrisma.entry.count
        .mockResolvedValueOnce(thisWeekCount)
        .mockResolvedValueOnce(lastWeekCount);
      mockPrisma.category.findMany.mockResolvedValueOnce(categories);
    }

    it('returns all zeroes and empty arrays when there are no entries', async () => {
      setupSummaryMocks();

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.totalEntries).toBe(0);
      expect(result.totalByType).toEqual({ WORK: 0, LEARNING: 0 });
      expect(result.averageProductivityScore).toBeNull();
      expect(result.byCategory).toHaveLength(0);
      expect(result.dailyActivity).toHaveLength(0);
      expect(result.weeklyTrend).toHaveLength(8);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it('returns correct totalEntries, totalByType, and averageProductivityScore', async () => {
      setupSummaryMocks({
        aggregate: { _count: { id: 10 }, _avg: { productivityScore: 7.45 } },
        typeGrouped: [
          { type: 'WORK', _count: { id: 6 } },
          { type: 'LEARNING', _count: { id: 4 } },
        ],
      });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.totalEntries).toBe(10);
      expect(result.totalByType).toEqual({ WORK: 6, LEARNING: 4 });
      expect(result.averageProductivityScore).toBe(7.5); // rounded to 1dp
    });

    it('returns averageProductivityScore as null when no entries have scores', async () => {
      setupSummaryMocks({
        aggregate: { _count: { id: 3 }, _avg: { productivityScore: null } },
      });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.averageProductivityScore).toBeNull();
    });

    it('assembles byCategory with correct entryCount, byType, and avgScore', async () => {
      setupSummaryMocks({
        byCategoryType: [
          { categoryId: 'cat-1', type: 'WORK', _count: { id: 6 } },
          { categoryId: 'cat-1', type: 'LEARNING', _count: { id: 8 } },
        ],
        byCategoryAgg: [
          {
            categoryId: 'cat-1',
            _count: { id: 14 },
            _avg: { productivityScore: 8.1 },
          },
        ],
        categories: [
          {
            id: 'cat-1',
            name: 'Backend',
            color: '#69B598',
            isCompleted: false,
          },
        ],
      });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.byCategory).toHaveLength(1);
      expect(result.byCategory[0].category.name).toBe('Backend');
      expect(result.byCategory[0].entryCount).toBe(14);
      expect(result.byCategory[0].averageProductivityScore).toBe(8.1);
      expect(result.byCategory[0].byType).toEqual({ WORK: 6, LEARNING: 8 });
    });

    it('sorts byCategory by entryCount descending', async () => {
      setupSummaryMocks({
        byCategoryType: [
          { categoryId: 'cat-1', type: 'WORK', _count: { id: 3 } },
          { categoryId: 'cat-2', type: 'WORK', _count: { id: 10 } },
        ],
        byCategoryAgg: [
          {
            categoryId: 'cat-1',
            _count: { id: 3 },
            _avg: { productivityScore: null },
          },
          {
            categoryId: 'cat-2',
            _count: { id: 10 },
            _avg: { productivityScore: null },
          },
        ],
        categories: [
          { id: 'cat-1', name: 'Algo', color: '#69B598', isCompleted: false },
          {
            id: 'cat-2',
            name: 'Backend',
            color: '#8285BA',
            isCompleted: false,
          },
        ],
      });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.byCategory[0].category.name).toBe('Backend');
      expect(result.byCategory[1].category.name).toBe('Algo');
    });

    it('pivots daily activity entries by date, merging WORK and LEARNING', async () => {
      const date = new Date('2024-01-15T00:00:00.000Z');
      setupSummaryMocks({
        byDayRaw: [
          { entryDate: date, type: 'WORK', _count: { id: 2 } },
          { entryDate: date, type: 'LEARNING', _count: { id: 3 } },
        ],
      });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.dailyActivity).toHaveLength(1);
      expect(result.dailyActivity[0]).toEqual({
        date: '2024-01-15',
        workCount: 2,
        learnCount: 3,
      });
    });

    it('always returns exactly 8 weeklyTrend entries', async () => {
      setupSummaryMocks();

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.weeklyTrend).toHaveLength(8);
    });

    it('returns null avgScore for weeks with no scored entries', async () => {
      setupSummaryMocks({ trendEntries: [] });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.weeklyTrend.every((w) => w.avgScore === null)).toBe(true);
    });

    it('computes avgScore for weeks that have scored entries', async () => {
      const { startOfISOWeek: soiw } =
        jest.requireActual<typeof import('date-fns')>('date-fns');
      const weekStart = soiw(new Date());
      setupSummaryMocks({
        trendEntries: [
          { entryDate: weekStart, productivityScore: 8 },
          { entryDate: weekStart, productivityScore: 6 },
        ],
      });

      const result = await service.getSummary('user-1', { period: '30d' });

      const currentWeek = result.weeklyTrend[7]; // last = this week
      expect(currentWeek.avgScore).toBe(7); // (8+6)/2
    });

    it('returns period in the response', async () => {
      setupSummaryMocks();
      const result7d = await service.getSummary('user-1', { period: '7d' });
      setupSummaryMocks();
      const resultWeek = await service.getSummary('user-1', { period: 'week' });

      expect(result7d.period).toBe('7d');
      expect(resultWeek.period).toBe('week');
    });

    it('applies start of current ISO week as entryDate filter for "week" period', async () => {
      const { startOfISOWeek: soiw } =
        jest.requireActual<typeof import('date-fns')>('date-fns');
      setupSummaryMocks();

      await service.getSummary('user-1', { period: 'week' });

      type AggCall = [{ where: { entryDate?: { gte: Date } } }];
      const gte = (mockPrisma.entry.aggregate.mock.calls as AggCall[])[0][0]
        .where.entryDate?.gte;
      expect(gte?.toISOString().slice(0, 10)).toBe(
        soiw(new Date()).toISOString().slice(0, 10),
      );
    });

    it('applies start of current month as entryDate filter for "month" period', async () => {
      const { startOfMonth: som } =
        jest.requireActual<typeof import('date-fns')>('date-fns');
      setupSummaryMocks();

      await service.getSummary('user-1', { period: 'month' });

      type AggCall = [{ where: { entryDate?: { gte: Date } } }];
      const gte = (mockPrisma.entry.aggregate.mock.calls as AggCall[])[0][0]
        .where.entryDate?.gte;
      expect(gte?.toISOString().slice(0, 10)).toBe(
        som(new Date()).toISOString().slice(0, 10),
      );
    });

    it('returns thisWeekCount and lastWeekCount from the DB queries', async () => {
      setupSummaryMocks({ thisWeekCount: 5, lastWeekCount: 7 });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.thisWeekCount).toBe(5);
      expect(result.lastWeekCount).toBe(7);
    });

    // ── Streak tests ──────────────────────────────────────────────────────────

    it('currentStreak is 0 when there are no entries', async () => {
      setupSummaryMocks({ distinctDates: [] });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it('currentStreak counts consecutive days ending today', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setUTCDate(today.getUTCDate() - 1);
      const dayBefore = new Date(today);
      dayBefore.setUTCDate(today.getUTCDate() - 2);

      setupSummaryMocks({
        distinctDates: [
          { entryDate: today },
          { entryDate: yesterday },
          { entryDate: dayBefore },
        ],
      });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.currentStreak).toBe(3);
    });

    it('currentStreak applies grace rule — streak is live if last entry was yesterday', async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const dayBefore = new Date(yesterday);
      dayBefore.setUTCDate(yesterday.getUTCDate() - 1);

      setupSummaryMocks({
        distinctDates: [{ entryDate: yesterday }, { entryDate: dayBefore }],
      });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.currentStreak).toBe(2);
    });

    it('currentStreak is 0 when last entry was two or more days ago', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

      setupSummaryMocks({ distinctDates: [{ entryDate: twoDaysAgo }] });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.currentStreak).toBe(0);
    });

    it('longestStreak correctly identifies the all-time longest run', async () => {
      // Gap between the two runs breaks the longer potential streak
      // Run 1: Jan 1, 2, 3 = 3 days
      // Gap: Jan 4 missing
      // Run 2: Jan 5, 6 = 2 days
      // Sorted desc: Jan 6, 5, 3, 2, 1
      setupSummaryMocks({
        distinctDates: [
          { entryDate: new Date('2024-01-06T00:00:00.000Z') },
          { entryDate: new Date('2024-01-05T00:00:00.000Z') },
          { entryDate: new Date('2024-01-03T00:00:00.000Z') },
          { entryDate: new Date('2024-01-02T00:00:00.000Z') },
          { entryDate: new Date('2024-01-01T00:00:00.000Z') },
        ],
      });

      const result = await service.getSummary('user-1', { period: '30d' });

      expect(result.longestStreak).toBe(3);
    });
  });
});
