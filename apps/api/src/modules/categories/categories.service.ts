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
} from '@grow-logs/schemas';
import { PrismaService } from '../../prisma/prisma.service.js';
import { assertOwnership } from '../../common/utils/ownership.util.js';

// All users are treated as free tier at MVP — billing is inactive.
// Update this constant and the enforcement queries when Stripe billing lands (Step 25).
const FREE_TIER_CATEGORY_LIMIT = 3;

export type SubcategoryItem = {
  id: string;
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

    const color =
      dto.color ?? COLOR_PALETTE[totalCount % COLOR_PALETTE.length];

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

  private toItem(
    category: {
      id: string;
      name: string;
      color: string;
      isCompleted: boolean;
      createdAt: Date;
      subcategories: SubcategoryItem[];
    },
  ): CategoryItem {
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
