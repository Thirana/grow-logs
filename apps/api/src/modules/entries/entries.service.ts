import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EntryType, SubscriptionStatus } from '@prisma/client';
import {
  type CreateEntryDto,
  type UpdateEntryDto,
  type EntryFiltersDto,
} from '@grow-logs/schemas';
import { PrismaService } from '../../prisma/prisma.service.js';
import { assertOwnership } from '../../common/utils/ownership.util.js';

// All users are treated as free tier at MVP — billing is inactive.
// Update this constant and enforcement query when Stripe billing lands (Step 25).
const FREE_TIER_DAILY_ENTRY_LIMIT = 10;

export type EntryResponse = {
  id: string;
  userId: string;
  categoryId: string;
  subcategoryId: string | null;
  type: EntryType;
  text: string;
  productivityScore: number | null;
  entryDate: Date;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; color: string };
  subcategory: { id: string; name: string } | null;
};

export type PaginatedEntriesResult = {
  items: EntryResponse[];
  total: number;
};

@Injectable()
export class EntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters: EntryFiltersDto,
  ): Promise<PaginatedEntriesResult> {
    const { page, limit, type, categoryId, subcategoryId, from, to } = filters;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(type ? { type } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(subcategoryId ? { subcategoryId } : {}),
      ...(from || to
        ? {
            entryDate: {
              ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
              ...(to ? { lte: new Date(`${to}T00:00:00.000Z`) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.entry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { entryDate: 'desc' },
        include: {
          category: { select: { id: true, name: true, color: true } },
          subcategory: { select: { id: true, name: true } },
        },
      }),
      this.prisma.entry.count({ where }),
    ]);

    return { items: items.map((e) => this.toResponse(e)), total };
  }

  async create(
    userId: string,
    subscriptionStatus: SubscriptionStatus,
    dto: CreateEntryDto,
  ): Promise<EntryResponse> {
    const todayUtc = new Date().toISOString().slice(0, 10);
    const resolvedDate = dto.entryDate ?? todayUtc;

    if (resolvedDate > todayUtc) {
      throw new UnprocessableEntityException(
        'Entry date cannot be in the future.',
      );
    }

    const entryDateDb = new Date(`${resolvedDate}T00:00:00.000Z`);

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { id: true, userId: true, isCompleted: true },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }

    if (category.isCompleted) {
      throw new UnprocessableEntityException(
        'Cannot add entries to a completed category. Reactivate it to continue logging.',
      );
    }

    if (dto.subcategoryId) {
      const subcategory = await this.prisma.subcategory.findUnique({
        where: { id: dto.subcategoryId },
        select: { id: true, categoryId: true, isCompleted: true },
      });

      if (!subcategory || subcategory.categoryId !== dto.categoryId) {
        throw new NotFoundException('Subcategory not found');
      }

      if (subcategory.isCompleted) {
        throw new UnprocessableEntityException(
          'Cannot assign entries to a completed subcategory. Reactivate it to use it again.',
        );
      }
    }

    if (subscriptionStatus === SubscriptionStatus.FREE) {
      const dailyCount = await this.prisma.entry.count({
        where: { userId, entryDate: entryDateDb },
      });

      if (dailyCount >= FREE_TIER_DAILY_ENTRY_LIMIT) {
        throw new UnprocessableEntityException(
          `You have reached the daily entry limit of 10 for ${resolvedDate}. Upgrade to Pro for unlimited entries.`,
        );
      }
    }

    const entry = await this.prisma.entry.create({
      data: {
        userId,
        type: dto.type,
        text: dto.text,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId ?? null,
        productivityScore: dto.productivityScore ?? null,
        entryDate: entryDateDb,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        subcategory: { select: { id: true, name: true } },
      },
    });

    return this.toResponse(entry);
  }

  async findOne(userId: string, entryId: string): Promise<EntryResponse> {
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        category: { select: { id: true, name: true, color: true } },
        subcategory: { select: { id: true, name: true } },
      },
    });

    if (!entry) throw new NotFoundException('Entry not found');
    assertOwnership(entry.userId, userId, 'Entry');

    return this.toResponse(entry);
  }

  async update(
    userId: string,
    entryId: string,
    dto: UpdateEntryDto,
  ): Promise<EntryResponse> {
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      select: { id: true, userId: true, categoryId: true, subcategoryId: true },
    });

    if (!entry) throw new NotFoundException('Entry not found');
    assertOwnership(entry.userId, userId, 'Entry');

    if (dto.entryDate !== undefined) {
      const todayUtc = new Date().toISOString().slice(0, 10);
      if (dto.entryDate > todayUtc) {
        throw new UnprocessableEntityException(
          'Entry date cannot be in the future.',
        );
      }
    }

    const updateData: {
      type?: EntryType;
      text?: string;
      productivityScore?: number | null;
      entryDate?: Date;
      categoryId?: string;
      subcategoryId?: string | null;
    } = {};

    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.text !== undefined) updateData.text = dto.text;
    if (dto.productivityScore !== undefined)
      updateData.productivityScore = dto.productivityScore;
    if (dto.entryDate !== undefined)
      updateData.entryDate = new Date(`${dto.entryDate}T00:00:00.000Z`);

    let effectiveCategoryId = entry.categoryId;

    if (dto.categoryId !== undefined && dto.categoryId !== entry.categoryId) {
      const newCategory = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true, userId: true, isCompleted: true },
      });

      if (!newCategory || newCategory.userId !== userId) {
        throw new NotFoundException('Category not found');
      }

      if (newCategory.isCompleted) {
        throw new UnprocessableEntityException(
          'Cannot reassign an entry to a completed category.',
        );
      }

      updateData.categoryId = dto.categoryId;
      effectiveCategoryId = dto.categoryId;

      // Silently clear subcategory when it does not belong to the new category.
      // The user is relocating the entry; the old subcategory is no longer relevant.
      if (entry.subcategoryId && dto.subcategoryId === undefined) {
        const existingSub = await this.prisma.subcategory.findUnique({
          where: { id: entry.subcategoryId },
          select: { categoryId: true },
        });
        if (!existingSub || existingSub.categoryId !== dto.categoryId) {
          updateData.subcategoryId = null;
        }
      }
    } else if (dto.categoryId !== undefined) {
      effectiveCategoryId = dto.categoryId;
    }

    if (dto.subcategoryId !== undefined) {
      const sub = await this.prisma.subcategory.findUnique({
        where: { id: dto.subcategoryId },
        select: { id: true, categoryId: true, isCompleted: true },
      });

      if (!sub || sub.categoryId !== effectiveCategoryId) {
        throw new UnprocessableEntityException(
          'Subcategory does not belong to the selected category.',
        );
      }

      if (sub.isCompleted) {
        throw new UnprocessableEntityException(
          'Cannot assign entries to a completed subcategory.',
        );
      }

      updateData.subcategoryId = dto.subcategoryId;
    }

    const updated = await this.prisma.entry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, color: true } },
        subcategory: { select: { id: true, name: true } },
      },
    });

    return this.toResponse(updated);
  }

  async delete(userId: string, entryId: string): Promise<void> {
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      select: { id: true, userId: true },
    });

    if (!entry) throw new NotFoundException('Entry not found');
    assertOwnership(entry.userId, userId, 'Entry');

    await this.prisma.entry.delete({ where: { id: entryId } });
  }

  private toResponse(entry: {
    id: string;
    userId: string;
    categoryId: string;
    subcategoryId: string | null;
    type: EntryType;
    text: string;
    productivityScore: number | null;
    entryDate: Date;
    createdAt: Date;
    updatedAt: Date;
    category: { id: string; name: string; color: string };
    subcategory: { id: string; name: string } | null;
  }): EntryResponse {
    return {
      id: entry.id,
      userId: entry.userId,
      categoryId: entry.categoryId,
      subcategoryId: entry.subcategoryId,
      type: entry.type,
      text: entry.text,
      productivityScore: entry.productivityScore,
      entryDate: entry.entryDate,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      category: entry.category,
      subcategory: entry.subcategory,
    };
  }
}
