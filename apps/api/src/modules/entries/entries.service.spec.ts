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
  },
  category: {
    findUnique: jest.fn(),
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
    jest.clearAllMocks();
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
});
