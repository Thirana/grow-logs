import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  COLOR_PALETTE,
  type CreateCategoryDto,
  type UpdateCategoryDto,
  type CategoryFiltersDto,
  type CreateSubcategoryDto,
  type UpdateSubcategoryDto,
} from '@grow-logs/schemas';
import { PrismaService } from '../../prisma/prisma.service.js';
import { assertOwnership } from '../../common/utils/ownership.util.js';

// All users are treated as free tier at MVP — billing is inactive.
// Update these constants and enforcement queries when Stripe billing lands (Step 25).
const FREE_TIER_CATEGORY_LIMIT = 3;
const FREE_TIER_SUBCATEGORY_LIMIT = 5;

export type SubcategoryItem = {
  id: string;
  name: string;
  isCompleted: boolean;
  createdAt: Date;
};

export type SubcategoryResponse = {
  id: string;
  categoryId: string;
  name: string;
  isCompleted: boolean;
  createdAt: Date;
};

export type CategoryItem = {
  id: string;
  name: string;
  color: string;
  isCompleted: boolean;
  createdAt: Date;
  subcategories: SubcategoryItem[];
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters?: CategoryFiltersDto,
  ): Promise<CategoryItem[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        userId,
        ...(filters?.isCompleted !== undefined
          ? { isCompleted: filters.isCompleted }
          : {}),
      },
      include: {
        subcategories: {
          select: {
            id: true,
            name: true,
            isCompleted: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      isCompleted: cat.isCompleted,
      createdAt: cat.createdAt,
      subcategories: cat.subcategories,
    }));
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryItem> {
    const [activeCount, totalCount, existing] = await Promise.all([
      this.prisma.category.count({
        where: { userId, isCompleted: false },
      }),
      this.prisma.category.count({ where: { userId } }),
      this.prisma.category.findFirst({
        where: { userId, name: dto.name },
        select: { id: true },
      }),
    ]);

    if (activeCount >= FREE_TIER_CATEGORY_LIMIT) {
      throw new UnprocessableEntityException(
        'Free plan allows a maximum of 3 active categories. Complete an existing category or upgrade to Pro to create more.',
      );
    }

    if (existing) {
      throw new ConflictException(
        `A category named "${dto.name}" already exists.`,
      );
    }

    const color = dto.color ?? COLOR_PALETTE[totalCount % COLOR_PALETTE.length];

    const category = await this.prisma.category.create({
      data: { userId, name: dto.name, color },
      include: {
        subcategories: {
          select: { id: true, name: true, isCompleted: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      isCompleted: category.isCompleted,
      createdAt: category.createdAt,
      subcategories: category.subcategories,
    };
  }

  async update(
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryItem> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, userId: true, isCompleted: true, name: true },
    });

    if (!category) {
      throw new UnprocessableEntityException('Category not found');
    }
    assertOwnership(category.userId, userId, 'Category');

    if (dto.isCompleted === true) {
      // Completing: idempotent — no error if already completed
      const updated = await this.prisma.category.update({
        where: { id: categoryId },
        data: { isCompleted: true },
        include: {
          subcategories: {
            select: {
              id: true,
              name: true,
              isCompleted: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      return this.toItem(updated);
    }

    if (dto.isCompleted === false) {
      // Reactivating: check active count (excluding this category)
      const activeCount = await this.prisma.category.count({
        where: {
          userId,
          isCompleted: false,
          id: { not: categoryId },
        },
      });

      if (activeCount >= FREE_TIER_CATEGORY_LIMIT) {
        throw new UnprocessableEntityException(
          'Free plan allows a maximum of 3 active categories. Complete another category first or upgrade to Pro.',
        );
      }

      const updated = await this.prisma.category.update({
        where: { id: categoryId },
        data: { isCompleted: false },
        include: {
          subcategories: {
            select: {
              id: true,
              name: true,
              isCompleted: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      return this.toItem(updated);
    }

    // Rename / recolor path
    if (category.isCompleted) {
      throw new UnprocessableEntityException(
        'Cannot rename or recolor a completed category. Reactivate it first.',
      );
    }

    if (dto.name && dto.name !== category.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: { userId, name: dto.name, id: { not: categoryId } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          `A category named "${dto.name}" already exists.`,
        );
      }
    }

    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
      },
      include: {
        subcategories: {
          select: { id: true, name: true, isCompleted: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return this.toItem(updated);
  }

  async delete(userId: string, categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, userId: true },
    });

    if (!category) {
      throw new UnprocessableEntityException('Category not found');
    }
    assertOwnership(category.userId, userId, 'Category');

    const entryCount = await this.prisma.entry.count({
      where: { categoryId },
    });

    if (entryCount > 0) {
      throw new UnprocessableEntityException(
        'Cannot delete a category that has entries. Mark it as complete instead.',
      );
    }

    await this.prisma.category.delete({ where: { id: categoryId } });
  }

  async createSubcategory(
    userId: string,
    categoryId: string,
    dto: CreateSubcategoryDto,
  ): Promise<SubcategoryResponse> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, userId: true, isCompleted: true },
    });

    if (!category) {
      throw new UnprocessableEntityException('Category not found');
    }
    assertOwnership(category.userId, userId, 'Category');

    if (category.isCompleted) {
      throw new UnprocessableEntityException(
        'Cannot add subcategories to a completed category. Reactivate it first.',
      );
    }

    const [activeCount, existing] = await Promise.all([
      this.prisma.subcategory.count({
        where: { categoryId, isCompleted: false },
      }),
      this.prisma.subcategory.findFirst({
        where: { categoryId, name: dto.name },
        select: { id: true },
      }),
    ]);

    if (activeCount >= FREE_TIER_SUBCATEGORY_LIMIT) {
      throw new UnprocessableEntityException(
        'Free plan allows a maximum of 5 active subcategories per category. Complete an existing subcategory or upgrade to Pro to create more.',
      );
    }

    if (existing) {
      throw new ConflictException(
        `A subcategory named "${dto.name}" already exists in this category.`,
      );
    }

    const subcategory = await this.prisma.subcategory.create({
      data: { categoryId, userId, name: dto.name },
      select: {
        id: true,
        categoryId: true,
        name: true,
        isCompleted: true,
        createdAt: true,
      },
    });

    return subcategory;
  }

  async updateSubcategory(
    userId: string,
    categoryId: string,
    subId: string,
    dto: UpdateSubcategoryDto,
  ): Promise<SubcategoryResponse> {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id: subId },
      select: {
        id: true,
        categoryId: true,
        userId: true,
        name: true,
        isCompleted: true,
      },
    });

    if (!subcategory || subcategory.categoryId !== categoryId) {
      throw new UnprocessableEntityException('Subcategory not found');
    }
    assertOwnership(subcategory.userId, userId, 'Subcategory');

    if (dto.isCompleted === true) {
      // Completing: idempotent — no error if already completed
      const updated = await this.prisma.subcategory.update({
        where: { id: subId },
        data: { isCompleted: true },
        select: {
          id: true,
          categoryId: true,
          name: true,
          isCompleted: true,
          createdAt: true,
        },
      });
      return updated;
    }

    if (dto.isCompleted === false) {
      // Reactivating: parent must be active, then check active subcategory count
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { isCompleted: true },
      });

      if (parentCategory?.isCompleted) {
        throw new UnprocessableEntityException(
          'Cannot reactivate a subcategory while its parent category is completed. Reactivate the parent category first.',
        );
      }

      const activeCount = await this.prisma.subcategory.count({
        where: {
          categoryId,
          isCompleted: false,
          id: { not: subId },
        },
      });

      if (activeCount >= FREE_TIER_SUBCATEGORY_LIMIT) {
        throw new UnprocessableEntityException(
          'Free plan allows a maximum of 5 active subcategories per category. Complete another subcategory first or upgrade to Pro.',
        );
      }

      const updated = await this.prisma.subcategory.update({
        where: { id: subId },
        data: { isCompleted: false },
        select: {
          id: true,
          categoryId: true,
          name: true,
          isCompleted: true,
          createdAt: true,
        },
      });
      return updated;
    }

    // Rename path
    if (subcategory.isCompleted) {
      throw new UnprocessableEntityException(
        'Cannot rename a completed subcategory. Reactivate it first.',
      );
    }

    if (dto.name && dto.name !== subcategory.name) {
      const duplicate = await this.prisma.subcategory.findFirst({
        where: { categoryId, name: dto.name, id: { not: subId } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          `A subcategory named "${dto.name}" already exists in this category.`,
        );
      }
    }

    const updated = await this.prisma.subcategory.update({
      where: { id: subId },
      data: { name: dto.name },
      select: {
        id: true,
        categoryId: true,
        name: true,
        isCompleted: true,
        createdAt: true,
      },
    });
    return updated;
  }

  async deleteSubcategory(
    userId: string,
    categoryId: string,
    subId: string,
  ): Promise<void> {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id: subId },
      select: { id: true, categoryId: true, userId: true },
    });

    if (!subcategory || subcategory.categoryId !== categoryId) {
      throw new UnprocessableEntityException('Subcategory not found');
    }
    assertOwnership(subcategory.userId, userId, 'Subcategory');

    const entryCount = await this.prisma.entry.count({
      where: { subcategoryId: subId },
    });

    if (entryCount > 0) {
      throw new UnprocessableEntityException(
        'Cannot delete a subcategory that has entries. Mark it as complete instead.',
      );
    }

    await this.prisma.subcategory.delete({ where: { id: subId } });
  }

  private toItem(category: {
    id: string;
    name: string;
    color: string;
    isCompleted: boolean;
    createdAt: Date;
    subcategories: SubcategoryItem[];
  }): CategoryItem {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      isCompleted: category.isCompleted,
      createdAt: category.createdAt,
      subcategories: category.subcategories,
    };
  }
}
