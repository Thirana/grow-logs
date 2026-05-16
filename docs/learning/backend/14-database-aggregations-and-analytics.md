# 14 — Database Aggregations and Analytics

**Phase:** Phase 8 (Step 24) | **Concepts:** SQL aggregation, GROUP BY, COUNT, AVG, Prisma groupBy and aggregate, in-memory pivoting, parallel aggregation queries, weekly trend, streak calculation

---

## What Aggregation Means

A regular query returns rows: each entry, each category, each user. An aggregation query computes something *about* a group of rows and returns a single result per group. Instead of "give me all the entries", you ask "how many entries are there?" or "what is the average productivity score per category?"

The SQL keywords that do this are `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. These are called **aggregate functions**. They collapse many rows into one computed value.

The critical rule: **you cannot mix individual row values with aggregate values in the same SELECT without using GROUP BY**.

---

## GROUP BY

`GROUP BY` partitions your rows into groups and applies aggregate functions to each group separately. The result has one row per group.

```sql
-- How many entries of each type does user 'user-1' have?
SELECT type, COUNT(*) as entry_count
FROM entries
WHERE user_id = 'user-1'
GROUP BY type;

-- Result:
-- type       | entry_count
-- -----------+------------
-- WORK       | 12
-- LEARNING   | 8
```

The `GROUP BY type` clause splits the entries into one group per distinct type value, then `COUNT(*)` counts rows in each group.

**The GROUP BY rule:** Every column in your SELECT must either be in the GROUP BY clause or wrapped in an aggregate function. If it is not, the database does not know which row's value to use for that column when many rows collapse into one group.

```sql
-- VALID: type is in GROUP BY, COUNT is an aggregate
SELECT type, COUNT(*)
FROM entries
GROUP BY type;

-- INVALID: text is neither in GROUP BY nor aggregated
-- Which text value would you get for 12 WORK entries?
SELECT type, text, COUNT(*)
FROM entries
GROUP BY type;  -- ← error: text must appear in GROUP BY or aggregate
```

---

## Prisma `groupBy`

Prisma's `groupBy` is the type-safe equivalent of SQL's `GROUP BY`. It only allows aggregate operations in the `_count`, `_avg`, `_sum`, `_min`, `_max` keys.

```typescript
// entries.service.ts — how many entries per type?
const typeGrouped = await this.prisma.entry.groupBy({
  by: ['type'],
  where: baseWhere,
  _count: { id: true },
});
// Result: [{ type: 'WORK', _count: { id: 12 } }, { type: 'LEARNING', _count: { id: 8 } }]
```

The `by` array specifies the GROUP BY columns. The `_count`, `_avg` etc. specify which aggregate functions to apply. The `where` filters rows before grouping.

### Per-category breakdown: two separate `groupBy` queries

The dashboard needs per-category data in two shapes:
1. Count by type within each category (for the `byType: { WORK, LEARNING }` breakdown)
2. Total entry count and average score per category (for `entryCount` and `averageProductivityScore`)

You cannot get both in a single `groupBy` call correctly. Consider what happens if you try:

```typescript
// Incorrect approach — avgScore would be wrong
await this.prisma.entry.groupBy({
  by: ['categoryId', 'type'],
  _count: { id: true },
  _avg: { productivityScore: true },
});
```

This groups by `(categoryId, type)`. The average score is computed per `(category, type)` pair. To get the overall average per category, you would need to compute a weighted average of the two pair averages in memory — which is more complex and error-prone than just asking for the category-level average directly.

The correct approach uses two separate queries:

```typescript
// entries.service.ts — two parallel groupBy queries with different BY columns
const [byCategoryTypeRaw, byCategoryAggRaw] = await Promise.all([
  // Query 1: count by (categoryId, type) for the WORK/LEARNING breakdown
  this.prisma.entry.groupBy({
    by: ['categoryId', 'type'],
    where: baseWhere,
    _count: { id: true },
  }),
  // Query 2: count + avg by categoryId only for entryCount and avgScore
  this.prisma.entry.groupBy({
    by: ['categoryId'],
    where: baseWhere,
    _count: { id: true },
    _avg: { productivityScore: true },
  }),
]);
```

These two queries run in parallel (they are part of the `Promise.all` in `getSummary`). The results are then joined in memory.

---

## Prisma `aggregate`

`aggregate` applies aggregate functions to the entire matching result set — no grouping. It returns a single object with all the aggregated values.

```typescript
// entries.service.ts — overall totals and average score
const overallAgg = await this.prisma.entry.aggregate({
  where: baseWhere,
  _count: { id: true },
  _avg: { productivityScore: true },
});
// Result: { _count: { id: 28 }, _avg: { productivityScore: 7.4 } }
```

**`aggregate` vs `groupBy`:**

| | `aggregate` | `groupBy` |
|---|---|---|
| Groups by | Nothing — entire result set | Specified columns |
| Returns | One row | One row per group |
| Use when | You need totals/averages for all matching rows | You need totals/averages per category, per type, per date |

---

## The `getSummary` Aggregation Architecture

The dashboard summary endpoint (`GET /v1/entries/summary`) is the most data-intensive query in the entire application. It needs nine different aggregations from the database, all independent of each other. They are fired in a single `Promise.all`:

```typescript
// entries.service.ts
const [
  overallAgg,        // total entries + overall avg score
  typeGrouped,       // entry count by type (WORK vs LEARNING)
  byCategoryTypeRaw, // entry count by (categoryId, type) pair
  byCategoryAggRaw,  // entry count + avg score by categoryId
  byDayRaw,          // entry count by (entryDate, type) pair
  trendEntries,      // raw entries for weekly trend computation
  thisWeekCount,     // count of entries this ISO week
  lastWeekCount,     // count of entries last ISO week
  distinctDates,     // all distinct dates for streak calculation
] = await Promise.all([
  this.prisma.entry.aggregate({ where: baseWhere, _count: { id: true }, _avg: { productivityScore: true } }),
  this.prisma.entry.groupBy({ by: ['type'], where: baseWhere, _count: { id: true } }),
  this.prisma.entry.groupBy({ by: ['categoryId', 'type'], where: baseWhere, _count: { id: true } }),
  this.prisma.entry.groupBy({ by: ['categoryId'], where: baseWhere, _count: { id: true }, _avg: { productivityScore: true } }),
  this.prisma.entry.groupBy({ by: ['entryDate', 'type'], where: baseWhere, _count: { id: true }, orderBy: { entryDate: 'asc' } }),
  this.prisma.entry.findMany({ where: { userId, entryDate: { gte: eightWeeksAgo }, productivityScore: { not: null } }, select: { entryDate: true, productivityScore: true } }),
  this.prisma.entry.count({ where: { userId, entryDate: { gte: thisWeekStart } } }),
  this.prisma.entry.count({ where: { userId, entryDate: { gte: lastWeekStart, lt: thisWeekStart } } }),
  this.prisma.entry.findMany({ where: { userId }, select: { entryDate: true }, distinct: ['entryDate'], orderBy: { entryDate: 'desc' } }),
]);
```

Nine queries sent simultaneously. The database processes them in parallel. The total latency is the duration of the slowest single query, not the sum of all nine.

After this block, one sequential query fetches category metadata (name, color, isCompleted) for the categories that appeared in the grouped results. It is sequential because it needs the `categoryIds` from `byCategoryTypeRaw`:

```typescript
const categoryIds = [...new Set(byCategoryTypeRaw.map((r) => r.categoryId))];
const categories = categoryIds.length > 0
  ? await this.prisma.category.findMany({ where: { id: { in: categoryIds } } })
  : [];
```

---

## Period Scoping vs Full-History Queries

Not all nine queries use the same `where`. The `period` parameter (7d, 30d, all) applies only to the stats the dashboard widget will filter by. Other stats are always full-history.

```typescript
// baseWhere includes the period date filter
const baseWhere = {
  userId,
  ...(periodDays !== null ? { entryDate: { gte: subDays(now, periodDays) } } : {}),
  ...(query.type ? { type: query.type } : {}),
};
```

| Query | Uses `baseWhere` (period-scoped) | Reason |
|---|---|---|
| `overallAgg` | Yes | Total entries and avg score are period-scoped |
| `typeGrouped` | Yes | Type breakdown is period-scoped |
| `byCategoryTypeRaw` / `byCategoryAggRaw` | Yes | Category breakdown is period-scoped |
| `byDayRaw` | Yes | Daily activity chart shows period |
| `trendEntries` | No — fixed 8-week window | Trend chart always shows 8 weeks regardless of period |
| `thisWeekCount` / `lastWeekCount` | No — fixed to this/last ISO week | Week comparison uses calendar week, not period |
| `distinctDates` | No — all-time | Streaks are all-time, not period-scoped |

---

## In-Memory Pivoting

Some aggregation results from the database need reshaping before they are sent in the response. This is called **pivoting** or **transforming** and it happens in application memory after the query returns.

### Daily activity pivot

The database returns one row per `(entryDate, type)` pair:

```
entryDate  | type     | count
2024-01-15 | WORK     | 2
2024-01-15 | LEARNING | 3
2024-01-16 | WORK     | 1
```

The API response needs one row per date with both counts:

```json
[
  { "date": "2024-01-15", "workCount": 2, "learnCount": 3 },
  { "date": "2024-01-16", "workCount": 1, "learnCount": 0 }
]
```

The in-memory pivot:

```typescript
// entries.service.ts
const dayMap = new Map<string, { workCount: number; learnCount: number }>();

for (const row of byDayRaw) {
  const dateStr = row.entryDate.toISOString().slice(0, 10);
  const existing = dayMap.get(dateStr) ?? { workCount: 0, learnCount: 0 };
  if (row.type === EntryType.WORK) existing.workCount += row._count.id;
  else existing.learnCount += row._count.id;
  dayMap.set(dateStr, existing);
}

const dailyActivity = Array.from(dayMap.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([date, { workCount, learnCount }]) => ({ date, workCount, learnCount }));
```

The Map is keyed by date string. For each row from the database, the appropriate counter (workCount or learnCount) is incremented. After the loop, the Map contains exactly the shape you need.

### Category data join in memory

The database returns `categoryId` in the grouped results, but the response needs `name`, `color`, and `isCompleted`. After fetching category metadata separately, the join happens in memory:

```typescript
const categoryMap = new Map(categories.map((c) => [c.id, c]));

const byCategory = categoryIds.map((catId) => {
  const cat = categoryMap.get(catId);       // O(1) lookup
  const agg = catAggMap.get(catId);         // O(1) lookup
  const types = catTypeMap.get(catId) ?? { WORK: 0, LEARNING: 0 };
  if (!cat || !agg) return null;
  return { category: cat, entryCount: agg._count.id, ... };
});
```

Using `Map` for the join gives O(1) lookups. If you used `Array.find` instead, each lookup would be O(n) — for a user with many categories across many grouped results, this becomes O(n²). The Map-based join is always O(n).

**Why not use a SQL JOIN instead?**

Prisma's `groupBy` does not support JOINs — it is a limitation of the type-safe API. The two-query approach (groupBy + findMany for metadata) is slightly less efficient than a raw SQL join but stays within Prisma's typed API, which is worth the trade-off at MVP scale.

---

## Weekly Trend: Fetching Raw Rows and Aggregating in Memory

The weekly trend chart always shows 8 weeks of productivity scores, regardless of the `period` parameter. Rather than doing the week-grouping in the database, the implementation fetches the relevant raw rows and aggregates in memory:

```typescript
// entries.service.ts — fetch raw scored entries for the 8-week window
const trendEntries = await this.prisma.entry.findMany({
  where: {
    userId,
    entryDate: { gte: eightWeeksAgo },
    productivityScore: { not: null },
  },
  select: { entryDate: true, productivityScore: true },
});
```

Then in memory, group by ISO week and compute the average:

```typescript
const weekScores = new Map<string, { sum: number; count: number }>();

for (const entry of trendEntries) {
  if (entry.productivityScore === null) continue;
  const weekStart = startOfISOWeek(entry.entryDate);
  const weekLabel = `${getISOWeekYear(weekStart)}-W${String(getISOWeek(weekStart)).padStart(2, '0')}`;
  const existing = weekScores.get(weekLabel) ?? { sum: 0, count: 0 };
  weekScores.set(weekLabel, {
    sum: existing.sum + entry.productivityScore,
    count: existing.count + 1,
  });
}
```

Finally, build an array of exactly 8 entries — one per week — with `null` for weeks with no scored entries:

```typescript
const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
  const weekStart = subWeeks(thisWeekStart, 7 - i);
  const weekLabel = this.isoWeekLabel(weekStart);
  const scores = weekScores.get(weekLabel);
  const avgScore = scores
    ? Math.round((scores.sum / scores.count) * 10) / 10
    : null;
  return { week: weekLabel, avgScore };
});
```

`Array.from({ length: 8 }, ...)` is a clean way to construct a fixed-length array. The index `i` goes 0..7; `7 - i` produces the week offset (oldest first). Week labels use the ISO 8601 week numbering format `YYYY-Www`.

**Why fetch raw rows instead of using database `groupBy`?**

The trend query could use `groupBy(['entryDate'])` but you would still need to group those dates into ISO weeks in memory (because databases do not have an ISO week function in Prisma's groupBy API). Fetching the raw rows and aggregating entirely in memory is equally correct and simpler to implement. At MVP scale (hundreds of entries per user over 8 weeks), the in-memory computation is negligible.

---

## Streak Calculation

Streaks are computed entirely in application memory. The database provides distinct entry dates, sorted descending:

```typescript
const distinctDates = await this.prisma.entry.findMany({
  where: { userId },
  select: { entryDate: true },
  distinct: ['entryDate'],
  orderBy: { entryDate: 'desc' },
});
```

`distinct: ['entryDate']` tells Prisma to deduplicate — if a user logged 5 entries on the same day, that day appears only once. This is equivalent to SQL's `SELECT DISTINCT entryDate`.

The streak walk itself is O(n) in the number of distinct dates — it walks the sorted list once:

```typescript
// entries.service.ts — computeStreaks private method
let longest = 1;
let run = 1;

for (let i = 0; i < dateStrings.length - 1; i++) {
  const curr = new Date(`${dateStrings[i]}T00:00:00.000Z`);
  const next = new Date(`${dateStrings[i + 1]}T00:00:00.000Z`);
  const diffDays = Math.round((curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    run++;
    if (run > longest) longest = run;
  } else {
    run = 1;
  }
}
```

Because the dates are sorted descending (most recent first), consecutive pairs in the array represent consecutive calendar days when `diffDays === 1`. A gap breaks the run.

The current streak uses a **grace rule**: if the most recent entry was yesterday (not today), the streak is still considered live. The user has until midnight to log today without breaking it:

```typescript
const mostRecent = dateStrings[0];
if (mostRecent === todayStr || mostRecent === yesterdayStr) {
  // streak is live — start counting from mostRecent
}
```

---

## Rounding Aggregated Scores

Floating-point averages from the database (`7.44999...`) are rounded to one decimal place before being sent in the response:

```typescript
const averageProductivityScore =
  overallAgg._avg.productivityScore !== null
    ? Math.round(overallAgg._avg.productivityScore * 10) / 10
    : null;
```

`Math.round(x * 10) / 10` rounds to one decimal place. Multiply by 10 to shift the decimal point, round to nearest integer, divide by 10 to shift back.

Why not use `toFixed(1)`? `toFixed` returns a string (`"7.5"`), not a number. JSON serialisation of a string produces `"7.5"` in the response instead of `7.5`. The frontend would receive the wrong type.

---

## Interview Summary

**Q: What is the difference between `aggregate` and `groupBy` in Prisma?**

> `aggregate` applies aggregate functions (COUNT, AVG) to the entire matching result set and returns one result. `groupBy` partitions matching rows into groups by specified columns and returns one aggregated result per group. Use `aggregate` when you need overall totals; use `groupBy` when you need totals per category, per type, or per date.

**Q: Why does `getSummary` run 9 database queries in a `Promise.all`?**

> The nine queries are all independent — none of them needs the output of another to form its input. Running them sequentially would add their individual latencies. `Promise.all` sends all nine to the database simultaneously, so the total wait is the duration of the slowest single query rather than the sum of all nine.

**Q: Why are some queries in `getSummary` period-scoped and others not?**

> The dashboard shows some widgets filtered by the selected period (daily activity, category breakdown, totals) and others that are always full-history regardless of period (streaks, weekly trend, this-week vs last-week counts). The `baseWhere` contains the period filter and is applied only to period-scoped queries. The others use only `userId`.

**Q: What is in-memory pivoting and why is it needed here?**

> The database returns one row per `(entryDate, type)` pair from the daily activity groupBy. The API response needs one row per date with both `workCount` and `learnCount` as fields. In-memory pivoting iterates the database result and accumulates both counts into a Map keyed by date — collapsing two rows per date into one. It is needed because Prisma's `groupBy` cannot produce the desired output shape directly.

**Q: Why use `distinct` when fetching dates for streak calculation?**

> A user may log multiple entries on the same day. For streak calculation, you only care whether the user logged at least one entry on each day, not how many. `distinct: ['entryDate']` deduplicates the dates at the database level so the streak walk sees each calendar day at most once, regardless of how many entries were created on that day.
