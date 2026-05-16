import { Test, TestingModule } from '@nestjs/testing';
import { EntryType, SubscriptionStatus, UserRole } from '@prisma/client';
import { EntriesController } from './entries.controller.js';
import { EntriesService } from './entries.service.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import type { EntryResponse } from './entries.service.js';

const mockService = {
  findAll: jest.fn(),
  create: jest.fn(),
  getSummary: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const user: AuthenticatedUser = {
  userId: 'user-1',
  role: UserRole.USER,
  subscriptionStatus: SubscriptionStatus.FREE,
};

const entryResponse: EntryResponse = {
  id: 'entry-1',
  userId: 'user-1',
  categoryId: 'cat-1',
  subcategoryId: null,
  type: EntryType.WORK,
  text: 'Implemented the controller layer for entries module.',
  productivityScore: 8,
  entryDate: new Date('2024-01-15T00:00:00.000Z'),
  createdAt: new Date('2024-01-15T10:00:00.000Z'),
  updatedAt: new Date('2024-01-15T10:00:00.000Z'),
  category: { id: 'cat-1', name: 'Backend', color: '#69B598' },
  subcategory: null,
};

describe('EntriesController', () => {
  let controller: EntriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [{ provide: EntriesService, useValue: mockService }],
    }).compile();

    controller = module.get(EntriesController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates to service and wraps in paginated envelope', async () => {
      mockService.findAll.mockResolvedValue({
        items: [entryResponse],
        total: 1,
      });

      const result = await controller.findAll(user, { page: 1, limit: 10 });

      expect(mockService.findAll).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 10,
      });
      expect(result.data).toEqual([entryResponse]);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('calculates totalPages correctly', async () => {
      mockService.findAll.mockResolvedValue({ items: [], total: 25 });

      const result = await controller.findAll(user, { page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('create', () => {
    it('passes subscriptionStatus to service and wraps in data envelope', async () => {
      mockService.create.mockResolvedValue(entryResponse);

      const dto = {
        type: 'WORK' as const,
        text: 'Implemented the controller layer for entries module.',
        categoryId: 'cat-1',
      };
      const result = await controller.create(user, dto);

      expect(mockService.create).toHaveBeenCalledWith(
        'user-1',
        SubscriptionStatus.FREE,
        dto,
      );
      expect(result).toEqual({ data: entryResponse, meta: {} });
    });
  });

  describe('getSummary', () => {
    it('delegates to service and wraps in data envelope', async () => {
      const summaryData = {
        period: '30d' as const,
        totalEntries: 5,
        totalByType: { WORK: 3, LEARNING: 2 },
        averageProductivityScore: 7.5,
        thisWeekCount: 2,
        lastWeekCount: 3,
        currentStreak: 4,
        longestStreak: 10,
        byCategory: [],
        dailyActivity: [],
        weeklyTrend: [],
      };
      mockService.getSummary.mockResolvedValue(summaryData);

      const result = await controller.getSummary(user, { period: '30d' });

      expect(mockService.getSummary).toHaveBeenCalledWith('user-1', {
        period: '30d',
      });
      expect(result).toEqual({ data: summaryData, meta: {} });
    });
  });

  describe('findOne', () => {
    it('delegates to service and wraps in data envelope', async () => {
      mockService.findOne.mockResolvedValue(entryResponse);

      const result = await controller.findOne(user, 'entry-1');

      expect(mockService.findOne).toHaveBeenCalledWith('user-1', 'entry-1');
      expect(result).toEqual({ data: entryResponse, meta: {} });
    });
  });

  describe('update', () => {
    it('delegates to service with entryId and dto', async () => {
      const updated = { ...entryResponse, text: 'Updated text here now.' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(user, 'entry-1', {
        text: 'Updated text here now.',
      });

      expect(mockService.update).toHaveBeenCalledWith('user-1', 'entry-1', {
        text: 'Updated text here now.',
      });
      expect(result).toEqual({ data: updated, meta: {} });
    });
  });

  describe('delete', () => {
    it('delegates to service and returns void', async () => {
      mockService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(user, 'entry-1');

      expect(mockService.delete).toHaveBeenCalledWith('user-1', 'entry-1');
      expect(result).toBeUndefined();
    });
  });
});
