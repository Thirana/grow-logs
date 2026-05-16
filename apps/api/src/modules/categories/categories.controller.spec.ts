import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { SubscriptionStatus, UserRole } from '@prisma/client';

const mockService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createSubcategory: jest.fn(),
  updateSubcategory: jest.fn(),
  deleteSubcategory: jest.fn(),
};

const user: AuthenticatedUser = {
  userId: 'user-1',
  role: UserRole.USER,
  subscriptionStatus: SubscriptionStatus.FREE,
};

const categoryItem = {
  id: 'cat-1',
  name: 'Backend',
  color: '#69B598',
  isCompleted: false,
  createdAt: new Date('2024-01-01'),
  subcategories: [],
};

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockService }],
    }).compile();

    controller = module.get(CategoriesController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates to service and wraps in data envelope', async () => {
      mockService.findAll.mockResolvedValue([categoryItem]);

      const result = await controller.findAll(user, {});

      expect(mockService.findAll).toHaveBeenCalledWith('user-1', {});
      expect(result).toEqual({ data: [categoryItem], meta: {} });
    });

    it('passes isCompleted filter to service', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll(user, { isCompleted: false });

      expect(mockService.findAll).toHaveBeenCalledWith('user-1', {
        isCompleted: false,
      });
    });
  });

  describe('create', () => {
    it('delegates to service and wraps in data envelope', async () => {
      mockService.create.mockResolvedValue(categoryItem);

      const result = await controller.create(user, { name: 'Backend' });

      expect(mockService.create).toHaveBeenCalledWith('user-1', {
        name: 'Backend',
      });
      expect(result).toEqual({ data: categoryItem, meta: {} });
    });
  });

  describe('update', () => {
    it('delegates to service with categoryId and dto', async () => {
      mockService.update.mockResolvedValue(categoryItem);

      const result = await controller.update(user, 'cat-1', {
        isCompleted: true,
      });

      expect(mockService.update).toHaveBeenCalledWith('user-1', 'cat-1', {
        isCompleted: true,
      });
      expect(result).toEqual({ data: categoryItem, meta: {} });
    });
  });

  describe('delete', () => {
    it('delegates to service and returns void', async () => {
      mockService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(user, 'cat-1');

      expect(mockService.delete).toHaveBeenCalledWith('user-1', 'cat-1');
      expect(result).toBeUndefined();
    });
  });

  const subcategoryItem = {
    id: 'sub-1',
    categoryId: 'cat-1',
    name: 'NestJS',
    isCompleted: false,
    createdAt: new Date('2024-01-01'),
  };

  describe('createSubcategory', () => {
    it('delegates to service with categoryId and dto', async () => {
      mockService.createSubcategory.mockResolvedValue(subcategoryItem);

      const result = await controller.createSubcategory(user, 'cat-1', {
        name: 'NestJS',
      });

      expect(mockService.createSubcategory).toHaveBeenCalledWith(
        'user-1',
        'cat-1',
        { name: 'NestJS' },
      );
      expect(result).toEqual({ data: subcategoryItem, meta: {} });
    });
  });

  describe('updateSubcategory', () => {
    it('delegates to service with categoryId, subId, and dto', async () => {
      mockService.updateSubcategory.mockResolvedValue({
        ...subcategoryItem,
        isCompleted: true,
      });

      const result = await controller.updateSubcategory(
        user,
        'cat-1',
        'sub-1',
        {
          isCompleted: true,
        },
      );

      expect(mockService.updateSubcategory).toHaveBeenCalledWith(
        'user-1',
        'cat-1',
        'sub-1',
        { isCompleted: true },
      );
      expect(result.data.isCompleted).toBe(true);
    });
  });

  describe('deleteSubcategory', () => {
    it('delegates to service and returns void', async () => {
      mockService.deleteSubcategory.mockResolvedValue(undefined);

      const result = await controller.deleteSubcategory(user, 'cat-1', 'sub-1');

      expect(mockService.deleteSubcategory).toHaveBeenCalledWith(
        'user-1',
        'cat-1',
        'sub-1',
      );
      expect(result).toBeUndefined();
    });
  });
});
