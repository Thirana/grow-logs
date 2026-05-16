import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CategoriesService } from './categories.service.js';

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  subcategory: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  entry: {
    count: jest.fn(),
  },
};

const baseCategory = {
  id: 'cat-1',
  userId: 'user-1',
  name: 'Backend',
  color: '#69B598',
  isCompleted: false,
  createdAt: new Date('2024-01-01'),
  subcategories: [],
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(CategoriesService);
    jest.clearAllMocks();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all categories when no filter provided', async () => {
      mockPrisma.category.findMany.mockResolvedValue([baseCategory]);

      const result = await service.findAll('user-1');

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Backend');
    });

    it('filters by isCompleted=false when filter is provided', async () => {
      mockPrisma.category.findMany.mockResolvedValue([baseCategory]);

      await service.findAll('user-1', { isCompleted: false });

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', isCompleted: false },
        }),
      );
    });

    it('filters by isCompleted=true when filter is provided', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      await service.findAll('user-1', { isCompleted: true });

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', isCompleted: true },
        }),
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a category and auto-assigns color from palette', async () => {
      mockPrisma.category.count
        .mockResolvedValueOnce(0) // activeCount
        .mockResolvedValueOnce(0); // totalCount
      mockPrisma.category.findFirst.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        ...baseCategory,
        color: '#69B598',
      });

      const result = await service.create('user-1', { name: 'Backend' });

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ color: '#69B598', name: 'Backend' }),
        }),
      );
      expect(result.name).toBe('Backend');
    });

    it('uses provided color when supplied', async () => {
      mockPrisma.category.count
        .mockResolvedValueOnce(1) // activeCount
        .mockResolvedValueOnce(1); // totalCount
      mockPrisma.category.findFirst.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        ...baseCategory,
        color: '#8285BA',
      });

      await service.create('user-1', { name: 'Frontend', color: '#8285BA' });

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ color: '#8285BA' }),
        }),
      );
    });

    it('throws UnprocessableEntityException when active category limit is reached', async () => {
      mockPrisma.category.count
        .mockResolvedValueOnce(3) // activeCount >= 3
        .mockResolvedValueOnce(3); // totalCount
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.create('user-1', { name: 'New' })).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when category name already exists', async () => {
      mockPrisma.category.count
        .mockResolvedValueOnce(1) // activeCount
        .mockResolvedValueOnce(2); // totalCount
      mockPrisma.category.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.create('user-1', { name: 'Backend' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws UnprocessableEntityException when category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'missing-id', { name: 'New' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws NotFoundException when category belongs to another user', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        userId: 'other-user',
      });

      await expect(
        service.update('user-1', 'cat-1', { name: 'New' }),
      ).rejects.toThrow('Category not found');
    });

    it('completes an active category (idempotent)', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.category.update.mockResolvedValue({
        ...baseCategory,
        isCompleted: true,
      });

      const result = await service.update('user-1', 'cat-1', {
        isCompleted: true,
      });

      expect(mockPrisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isCompleted: true } }),
      );
      expect(result.isCompleted).toBe(true);
    });

    it('completing an already-completed category does not error', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        isCompleted: true,
      });
      mockPrisma.category.update.mockResolvedValue({
        ...baseCategory,
        isCompleted: true,
      });

      await expect(
        service.update('user-1', 'cat-1', { isCompleted: true }),
      ).resolves.not.toThrow();
    });

    it('reactivates a completed category when under the active limit', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        isCompleted: true,
      });
      mockPrisma.category.count.mockResolvedValue(2); // 2 active (< 3)
      mockPrisma.category.update.mockResolvedValue({
        ...baseCategory,
        isCompleted: false,
      });

      const result = await service.update('user-1', 'cat-1', {
        isCompleted: false,
      });
      expect(result.isCompleted).toBe(false);
    });

    it('throws UnprocessableEntityException when reactivating would exceed active limit', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        isCompleted: true,
      });
      mockPrisma.category.count.mockResolvedValue(3); // already 3 active

      await expect(
        service.update('user-1', 'cat-1', { isCompleted: false }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(mockPrisma.category.update).not.toHaveBeenCalled();
    });

    it('renames an active category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.category.findFirst.mockResolvedValue(null); // no duplicate
      mockPrisma.category.update.mockResolvedValue({
        ...baseCategory,
        name: 'Renamed',
      });

      const result = await service.update('user-1', 'cat-1', {
        name: 'Renamed',
      });
      expect(result.name).toBe('Renamed');
    });

    it('throws UnprocessableEntityException when renaming a completed category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        isCompleted: true,
      });

      await expect(
        service.update('user-1', 'cat-1', { name: 'New Name' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws ConflictException when renaming to an existing name', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.category.findFirst.mockResolvedValue({ id: 'other-cat' });

      await expect(
        service.update('user-1', 'cat-1', { name: 'Existing' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('throws UnprocessableEntityException when category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'missing-id')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws NotFoundException when category belongs to another user', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        userId: 'other-user',
      });

      await expect(service.delete('user-1', 'cat-1')).rejects.toThrow(
        'Category not found',
      );
    });

    it('throws UnprocessableEntityException when category has entries', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.entry.count.mockResolvedValue(3);

      await expect(service.delete('user-1', 'cat-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(mockPrisma.category.delete).not.toHaveBeenCalled();
    });

    it('deletes an empty category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.entry.count.mockResolvedValue(0);
      mockPrisma.category.delete.mockResolvedValue(baseCategory);

      await expect(service.delete('user-1', 'cat-1')).resolves.toBeUndefined();
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });
  });

  // ─── createSubcategory ───────────────────────────────────────────────────────

  describe('createSubcategory', () => {
    const baseSub = {
      id: 'sub-1',
      categoryId: 'cat-1',
      userId: 'user-1',
      name: 'NestJS',
      isCompleted: false,
      createdAt: new Date('2024-01-01'),
    };

    it('creates a subcategory under an active category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.subcategory.count.mockResolvedValue(2); // 2 active (< 5)
      mockPrisma.subcategory.findFirst.mockResolvedValue(null);
      mockPrisma.subcategory.create.mockResolvedValue(baseSub);

      const result = await service.createSubcategory('user-1', 'cat-1', {
        name: 'NestJS',
      });

      expect(mockPrisma.subcategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { categoryId: 'cat-1', userId: 'user-1', name: 'NestJS' },
        }),
      );
      expect(result.isCompleted).toBe(false);
    });

    it('throws UnprocessableEntityException when category not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.createSubcategory('user-1', 'cat-1', { name: 'NestJS' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws NotFoundException when category belongs to another user', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        userId: 'other-user',
      });

      await expect(
        service.createSubcategory('user-1', 'cat-1', { name: 'NestJS' }),
      ).rejects.toThrow('Category not found');
    });

    it('throws UnprocessableEntityException when parent category is completed', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        isCompleted: true,
      });

      await expect(
        service.createSubcategory('user-1', 'cat-1', { name: 'NestJS' }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(mockPrisma.subcategory.create).not.toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when active subcategory limit reached', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.subcategory.count.mockResolvedValue(5); // at limit
      mockPrisma.subcategory.findFirst.mockResolvedValue(null);

      await expect(
        service.createSubcategory('user-1', 'cat-1', { name: 'NestJS' }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(mockPrisma.subcategory.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when subcategory name already exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(baseCategory);
      mockPrisma.subcategory.count.mockResolvedValue(2);
      mockPrisma.subcategory.findFirst.mockResolvedValue({
        id: 'existing-sub',
      });

      await expect(
        service.createSubcategory('user-1', 'cat-1', { name: 'NestJS' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── updateSubcategory ───────────────────────────────────────────────────────

  describe('updateSubcategory', () => {
    const baseSub = {
      id: 'sub-1',
      categoryId: 'cat-1',
      userId: 'user-1',
      name: 'NestJS',
      isCompleted: false,
      createdAt: new Date('2024-01-01'),
    };

    it('throws UnprocessableEntityException when subcategory not found', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSubcategory('user-1', 'cat-1', 'sub-1', { name: 'New' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when subcategory categoryId does not match URL param', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSub,
        categoryId: 'different-cat',
      });

      await expect(
        service.updateSubcategory('user-1', 'cat-1', 'sub-1', { name: 'New' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws NotFoundException when subcategory belongs to another user', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSub,
        userId: 'other-user',
      });

      await expect(
        service.updateSubcategory('user-1', 'cat-1', 'sub-1', { name: 'New' }),
      ).rejects.toThrow('Subcategory not found');
    });

    it('completes an active subcategory (idempotent)', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue(baseSub);
      mockPrisma.subcategory.update.mockResolvedValue({
        ...baseSub,
        isCompleted: true,
      });

      const result = await service.updateSubcategory(
        'user-1',
        'cat-1',
        'sub-1',
        {
          isCompleted: true,
        },
      );
      expect(result.isCompleted).toBe(true);
    });

    it('completing an already-completed subcategory does not error', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSub,
        isCompleted: true,
      });
      mockPrisma.subcategory.update.mockResolvedValue({
        ...baseSub,
        isCompleted: true,
      });

      await expect(
        service.updateSubcategory('user-1', 'cat-1', 'sub-1', {
          isCompleted: true,
        }),
      ).resolves.not.toThrow();
    });

    it('reactivates a subcategory when parent is active and under limit', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSub,
        isCompleted: true,
      });
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        isCompleted: false,
      });
      mockPrisma.subcategory.count.mockResolvedValue(3); // 3 active (< 5)
      mockPrisma.subcategory.update.mockResolvedValue({
        ...baseSub,
        isCompleted: false,
      });

      const result = await service.updateSubcategory(
        'user-1',
        'cat-1',
        'sub-1',
        {
          isCompleted: false,
        },
      );
      expect(result.isCompleted).toBe(false);
    });

    it('throws UnprocessableEntityException when reactivating with completed parent', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSub,
        isCompleted: true,
      });
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        isCompleted: true,
      });

      await expect(
        service.updateSubcategory('user-1', 'cat-1', 'sub-1', {
          isCompleted: false,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when reactivation exceeds active subcategory limit', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSub,
        isCompleted: true,
      });
      mockPrisma.category.findUnique.mockResolvedValue({
        ...baseCategory,
        isCompleted: false,
      });
      mockPrisma.subcategory.count.mockResolvedValue(5); // at limit

      await expect(
        service.updateSubcategory('user-1', 'cat-1', 'sub-1', {
          isCompleted: false,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('renames an active subcategory', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue(baseSub);
      mockPrisma.subcategory.findFirst.mockResolvedValue(null);
      mockPrisma.subcategory.update.mockResolvedValue({
        ...baseSub,
        name: 'Renamed',
      });

      const result = await service.updateSubcategory(
        'user-1',
        'cat-1',
        'sub-1',
        {
          name: 'Renamed',
        },
      );
      expect(result.name).toBe('Renamed');
    });

    it('throws UnprocessableEntityException when renaming a completed subcategory', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSub,
        isCompleted: true,
      });

      await expect(
        service.updateSubcategory('user-1', 'cat-1', 'sub-1', { name: 'New' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws ConflictException when renaming to an existing name', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue(baseSub);
      mockPrisma.subcategory.findFirst.mockResolvedValue({ id: 'other-sub' });

      await expect(
        service.updateSubcategory('user-1', 'cat-1', 'sub-1', {
          name: 'Existing',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── deleteSubcategory ───────────────────────────────────────────────────────

  describe('deleteSubcategory', () => {
    const baseSub = {
      id: 'sub-1',
      categoryId: 'cat-1',
      userId: 'user-1',
    };

    it('throws UnprocessableEntityException when subcategory not found', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteSubcategory('user-1', 'cat-1', 'sub-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws UnprocessableEntityException when subcategory categoryId does not match', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSub,
        categoryId: 'wrong-cat',
      });

      await expect(
        service.deleteSubcategory('user-1', 'cat-1', 'sub-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws NotFoundException when subcategory belongs to another user', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({
        ...baseSub,
        userId: 'other-user',
      });

      await expect(
        service.deleteSubcategory('user-1', 'cat-1', 'sub-1'),
      ).rejects.toThrow('Subcategory not found');
    });

    it('throws UnprocessableEntityException when subcategory has entries', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue(baseSub);
      mockPrisma.entry.count.mockResolvedValue(2);

      await expect(
        service.deleteSubcategory('user-1', 'cat-1', 'sub-1'),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(mockPrisma.subcategory.delete).not.toHaveBeenCalled();
    });

    it('deletes an empty subcategory', async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue(baseSub);
      mockPrisma.entry.count.mockResolvedValue(0);
      mockPrisma.subcategory.delete.mockResolvedValue(baseSub);

      await expect(
        service.deleteSubcategory('user-1', 'cat-1', 'sub-1'),
      ).resolves.toBeUndefined();
      expect(mockPrisma.subcategory.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      });
    });
  });
});
