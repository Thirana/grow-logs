import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EntryType, SubscriptionStatus } from '@prisma/client';
import {
  subDays,
  subWeeks,
  startOfISOWeek,
  startOfMonth,
  getISOWeek,
  getISOWeekYear,
} from 'date-fns';
import {
  type CreateEntryDto,
  type UpdateEntryDto,
  type EntryFiltersDto,
  type SummaryQueryDto,
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

export type CategorySummaryItem = {
  category: { id: string; name: string; color: string; isCompleted: boolean };
  entryCount: number;
  averageProductivityScore: number | null;
  byType: { WORK: number; LEARNING: number };
};

export type SummaryResponse = {
  period: '7d' | '30d' | 'week' | 'month';
  totalEntries: number;
  totalByType: { WORK: number; LEARNING: number };
  averageProductivityScore: number | null;
  thisWeekCount: number;
  lastWeekCount: number;
  currentStreak: number;
  longestStreak: number;
  byCategory: CategorySummaryItem[];
  dailyActivity: {
    date: string;
    workCount: number;
    learnCount: number;
    avgScore: number | null;
    categoryCount: number;
    dominantCategory: { name: string; color: string } | null;
  }[];
  weeklyTrend: { week: string; avgScore: number | null }[];
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

    if (dto.subcategoryId === null) {
      updateData.subcategoryId = null;
    } else if (dto.subcategoryId !== undefined) {
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

  async getSummary(
    userId: string,
    query: SummaryQueryDto,
  ): Promise<SummaryResponse> {
    const now = new Date();
    const periodStart: Date | null =
      query.period === '7d'
        ? subDays(now, 7)
        : query.period === '30d'
          ? subDays(now, 30)
          : query.period === 'week'
            ? startOfISOWeek(now)
            : query.period === 'month'
              ? startOfMonth(now)
              : null;

    const baseWhere = {
      userId,
      ...(periodStart !== null ? { entryDate: { gte: periodStart } } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const thisWeekStart = startOfISOWeek(now);
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    // Fixed 8-week window for the trend chart, independent of the selected period.
    // The trend always shows 8 weeks regardless of period so the chart is never near-empty.
    const eightWeeksAgo = subWeeks(thisWeekStart, 7);

    const [
      overallAgg,
      typeGrouped,
      byCategoryTypeRaw,
      byCategoryAggRaw,
      byDayRaw,
      byDayAvgRaw,
      byDayCatRaw,
      trendEntries,
      thisWeekCount,
      lastWeekCount,
      distinctDates,
    ] = await Promise.all([
      this.prisma.entry.aggregate({
        where: baseWhere,
        _count: { id: true },
        _avg: { productivityScore: true },
      }),
      this.prisma.entry.groupBy({
        by: ['type'],
        where: baseWhere,
        _count: { id: true },
      }),
      this.prisma.entry.groupBy({
        by: ['categoryId', 'type'],
        where: baseWhere,
        _count: { id: true },
      }),
      this.prisma.entry.groupBy({
        by: ['categoryId'],
        where: baseWhere,
        _count: { id: true },
        _avg: { productivityScore: true },
      }),
      this.prisma.entry.groupBy({
        by: ['entryDate', 'type'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { entryDate: 'asc' },
      }),
      this.prisma.entry.groupBy({
        by: ['entryDate'],
        where: baseWhere,
        _avg: { productivityScore: true },
      }),
      this.prisma.entry.groupBy({
        by: ['entryDate', 'categoryId'],
        where: baseWhere,
        _count: { id: true },
      }),
      this.prisma.entry.findMany({
        where: {
          userId,
          entryDate: { gte: eightWeeksAgo },
          productivityScore: { not: null },
        },
        select: { entryDate: true, productivityScore: true },
      }),
      this.prisma.entry.count({
        where: { userId, entryDate: { gte: thisWeekStart } },
      }),
      this.prisma.entry.count({
        where: { userId, entryDate: { gte: lastWeekStart, lt: thisWeekStart } },
      }),
      this.prisma.entry.findMany({
        where: { userId },
        select: { entryDate: true },
        distinct: ['entryDate'],
        orderBy: { entryDate: 'desc' },
      }),
    ]);

    // ── Category metadata (sequential — depends on byCategoryTypeRaw) ──────────
    const categoryIds = [
      ...new Set(byCategoryTypeRaw.map((r) => r.categoryId)),
    ];
    const categories =
      categoryIds.length > 0
        ? await this.prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, color: true, isCompleted: true },
          })
        : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // ── Core stats ───────────────────────────────────────────────────────────────
    const totalEntries = overallAgg._count.id;
    const averageProductivityScore =
      overallAgg._avg.productivityScore !== null
        ? Math.round(overallAgg._avg.productivityScore * 10) / 10
        : null;

    const totalByType = { WORK: 0, LEARNING: 0 };
    for (const g of typeGrouped) {
      if (g.type === EntryType.WORK) totalByType.WORK = g._count.id;
      else totalByType.LEARNING = g._count.id;
    }

    // ── By category ──────────────────────────────────────────────────────────────
    const catTypeMap = new Map<string, { WORK: number; LEARNING: number }>();
    for (const row of byCategoryTypeRaw) {
      const existing = catTypeMap.get(row.categoryId) ?? {
        WORK: 0,
        LEARNING: 0,
      };
      if (row.type === EntryType.WORK) existing.WORK += row._count.id;
      else existing.LEARNING += row._count.id;
      catTypeMap.set(row.categoryId, existing);
    }

    const catAggMap = new Map(byCategoryAggRaw.map((r) => [r.categoryId, r]));

    const byCategory: CategorySummaryItem[] = categoryIds
      .map((catId) => {
        const cat = categoryMap.get(catId);
        const agg = catAggMap.get(catId);
        const types = catTypeMap.get(catId) ?? { WORK: 0, LEARNING: 0 };
        if (!cat || !agg) return null;
        return {
          category: cat,
          entryCount: agg._count.id,
          averageProductivityScore:
            agg._avg.productivityScore !== null
              ? Math.round(agg._avg.productivityScore * 10) / 10
              : null,
          byType: { WORK: types.WORK, LEARNING: types.LEARNING },
        };
      })
      .filter((c): c is CategorySummaryItem => c !== null)
      .sort((a, b) => b.entryCount - a.entryCount);

    // ── Daily activity ────────────────────────────────────────────────────────────
    const dayMap = new Map<string, { workCount: number; learnCount: number }>();
    for (const row of byDayRaw) {
      const dateStr = row.entryDate.toISOString().slice(0, 10);
      const existing = dayMap.get(dateStr) ?? { workCount: 0, learnCount: 0 };
      if (row.type === EntryType.WORK) existing.workCount += row._count.id;
      else existing.learnCount += row._count.id;
      dayMap.set(dateStr, existing);
    }

    const dayAvgMap = new Map<string, number | null>();
    for (const row of byDayAvgRaw) {
      const dateStr = row.entryDate.toISOString().slice(0, 10);
      dayAvgMap.set(
        dateStr,
        row._avg.productivityScore !== null
          ? Math.round(row._avg.productivityScore * 10) / 10
          : null,
      );
    }

    // Per-day category breakdown: distinct count + dominant category for the focus/spotlight heatmaps.
    const dayCatMap = new Map<string, Map<string, number>>();
    for (const row of byDayCatRaw) {
      const dateStr = row.entryDate.toISOString().slice(0, 10);
      const catMap = dayCatMap.get(dateStr) ?? new Map<string, number>();
      catMap.set(row.categoryId, row._count.id);
      dayCatMap.set(dateStr, catMap);
    }

    const dailyActivity = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { workCount, learnCount }]) => {
        const catMap = dayCatMap.get(date);
        let categoryCount = 0;
        let dominantCategory: { name: string; color: string } | null = null;

        if (catMap && catMap.size > 0) {
          categoryCount = catMap.size;
          let maxCount = 0;
          let dominantCatId: string | null = null;
          for (const [catId, count] of catMap) {
            if (count > maxCount) {
              maxCount = count;
              dominantCatId = catId;
            }
          }
          if (dominantCatId) {
            const cat = categoryMap.get(dominantCatId);
            if (cat) dominantCategory = { name: cat.name, color: cat.color };
          }
        }

        return {
          date,
          workCount,
          learnCount,
          avgScore: dayAvgMap.get(date) ?? null,
          categoryCount,
          dominantCategory,
        };
      });

    // ── Weekly productivity trend (fixed 8-week window) ──────────────────────────
    const weekScores = new Map<string, { sum: number; count: number }>();
    for (const entry of trendEntries) {
      if (entry.productivityScore === null) continue;
      const weekStart = startOfISOWeek(entry.entryDate);
      const weekLabel = this.isoWeekLabel(weekStart);
      const existing = weekScores.get(weekLabel) ?? { sum: 0, count: 0 };
      weekScores.set(weekLabel, {
        sum: existing.sum + entry.productivityScore,
        count: existing.count + 1,
      });
    }

    const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const weekStart = subWeeks(thisWeekStart, 7 - i);
      const weekLabel = this.isoWeekLabel(weekStart);
      const scores = weekScores.get(weekLabel);
      const avgScore = scores
        ? Math.round((scores.sum / scores.count) * 10) / 10
        : null;
      return { week: weekLabel, avgScore };
    });

    // ── Streaks ──────────────────────────────────────────────────────────────────
    const dateStrings = distinctDates.map((d) =>
      d.entryDate.toISOString().slice(0, 10),
    );
    const { current: currentStreak, longest: longestStreak } =
      this.computeStreaks(dateStrings, now);

    return {
      period: query.period,
      totalEntries,
      totalByType,
      averageProductivityScore,
      thisWeekCount,
      lastWeekCount,
      currentStreak,
      longestStreak,
      byCategory,
      dailyActivity,
      weeklyTrend,
    };
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

  private isoWeekLabel(date: Date): string {
    return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
  }

  // dateStrings must be sorted descending (most recent first).
  private computeStreaks(
    dateStrings: string[],
    now: Date,
  ): { current: number; longest: number } {
    if (dateStrings.length === 0) return { current: 0, longest: 0 };

    const todayStr = now.toISOString().slice(0, 10);
    const yesterdayStr = subDays(now, 1).toISOString().slice(0, 10);

    // Current streak — grace rule: streak is live if the last entry was today or yesterday.
    let current = 0;
    const mostRecent = dateStrings[0];
    if (mostRecent === todayStr || mostRecent === yesterdayStr) {
      current = 1;
      let prev = mostRecent;
      for (let i = 1; i < dateStrings.length; i++) {
        const expected = subDays(new Date(`${prev}T00:00:00.000Z`), 1)
          .toISOString()
          .slice(0, 10);
        if (dateStrings[i] === expected) {
          current++;
          prev = dateStrings[i];
        } else {
          break;
        }
      }
    }

    // Longest streak — walks the entire date history once (O(n)).
    let longest = 1;
    let run = 1;
    for (let i = 0; i < dateStrings.length - 1; i++) {
      const curr = new Date(`${dateStrings[i]}T00:00:00.000Z`);
      const next = new Date(`${dateStrings[i + 1]}T00:00:00.000Z`);
      const diffDays = Math.round(
        (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 1;
      }
    }

    return { current, longest };
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
