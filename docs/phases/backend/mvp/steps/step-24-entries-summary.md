# Step 24 — EntriesModule: Summary Analytics

**Phase:** Phase 8 — EntriesModule
**Depends on:** Step 23 (entries CRUD must exist, data must be queryable)

---

## What

Implement the `GET /v1/entries/summary` endpoint that powers the entire dashboard. It returns aggregated statistics for the authenticated user's entries: total count, type breakdown, average productivity score, per-category breakdown, per-day activity series, weekly productivity trend, week-over-week comparison, and streak tracking — all in a single response.

---

## Why

This is the most complex query in the entire backend, and it drives the dashboard's core value proposition. It is split into its own step because:
1. The aggregation logic warrants focused testing against real data
2. Bugs here are harder to isolate if implemented alongside simpler CRUD endpoints
3. Multiple GROUP BY, conditional aggregations, and streak walks are easy to get subtly wrong

Every dashboard widget reads from this single endpoint:
- `StatsRow` — `totalEntries`, `thisWeekCount`, `lastWeekCount`, `averageProductivityScore`, `currentStreak`, `longestStreak`, `totalByType`
- `ActivityCard (DailyChart)` — `dailyActivity[]`
- `ActivityCard (CategoryChart)` — `byCategory[]`
- `ProductivityTrend` — `weeklyTrend[]`

---

## Deliverables

### `packages/schemas/src/entries.ts` update

```ts
export const summaryQuerySchema = z.object({
  period: z.enum(['7d', '30d', 'all']).default('30d'),
  type: entryTypeSchema.optional(),
});
```

### `EntriesService.getSummary(userId, query)`

**Step 1 — Build the date filter for the selected period:**
```ts
const now = new Date();
const dateFilter = query.period === 'all'
  ? {}
  : { entryDate: { gte: subDays(now, query.period === '7d' ? 7 : 30) } };
const typeFilter = query.type ? { type: query.type } : {};
const baseWhere = { userId, ...dateFilter, ...typeFilter };
```

**Step 2 — Core aggregation (totalEntries, totalByType, averageProductivityScore):**
```ts
const grouped = await prisma.entry.groupBy({
  by: ['type'],
  where: baseWhere,
  _count: { id: true },
  _avg: { productivityScore: true },
});
```

**Step 3 — Per-category breakdown:**
```ts
const byCategory = await prisma.entry.groupBy({
  by: ['categoryId', 'type'],
  where: baseWhere,
  _count: { id: true },
  _avg: { productivityScore: true },
});
// Fetch category names for all returned categoryIds, then group in memory
```

**Step 4 — Per-day activity series (`dailyActivity`):**
```ts
const byDay = await prisma.entry.groupBy({
  by: ['entryDate', 'type'],
  where: baseWhere,
  _count: { id: true },
  orderBy: { entryDate: 'asc' },
});
// Pivot in memory: merge WORK and LEARNING rows for same date into
// { date: string, workCount: number, learnCount: number }
```

**Step 5 — Weekly productivity trend (`weeklyTrend`, fixed 8-week window regardless of `period`):**
```ts
const eightWeeksAgo = subWeeks(startOfISOWeek(now), 7); // start of 8 weeks ago
const trendEntries = await prisma.entry.findMany({
  where: { userId, entryDate: { gte: eightWeeksAgo }, productivityScore: { not: null } },
  select: { entryDate: true, productivityScore: true },
});
// Group by ISO week number in memory, compute avg per week
// Return null for weeks with no scored entries
// Result: 8 entries ordered oldest → newest
```

**Step 6 — Week-over-week count (`thisWeekCount`, `lastWeekCount`):**
```ts
const thisWeekStart = startOfISOWeek(now);
const lastWeekStart = subWeeks(thisWeekStart, 1);

const [thisWeekCount, lastWeekCount] = await Promise.all([
  prisma.entry.count({ where: { userId, entryDate: { gte: thisWeekStart } } }),
  prisma.entry.count({ where: { userId, entryDate: { gte: lastWeekStart, lt: thisWeekStart } } }),
]);
```

**Step 7 — Streak calculation (`currentStreak`, `longestStreak`):**
```ts
// Fetch all distinct entryDates for the user, ordered descending
const dates = await prisma.entry.findMany({
  where: { userId },
  select: { entryDate: true },
  distinct: ['entryDate'],
  orderBy: { entryDate: 'desc' },
});

// Walk the sorted list to compute:
// currentStreak: consecutive days from today (or yesterday) backwards
// longestStreak: longest consecutive run in the full history
```

Streak walk rules:
- A day counts if the user logged at least one entry on that calendar date
- `currentStreak` starts from today; if today has no entry, it starts from yesterday (grace: a streak is not broken until you miss two consecutive days from the current moment)
- `longestStreak` walks the entire date list once — O(n) in the number of distinct entry dates

**Step 8 — Assemble response:**

```json
{
  "data": {
    "period": "30d",
    "totalEntries": 28,
    "totalByType": { "WORK": 12, "LEARNING": 16 },
    "averageProductivityScore": 7.4,
    "thisWeekCount": 5,
    "lastWeekCount": 7,
    "currentStreak": 9,
    "longestStreak": 23,
    "byCategory": [
      {
        "category": { "id": "uuid", "name": "Backend", "color": "#69B598" },
        "entryCount": 14,
        "averageProductivityScore": 8.1,
        "byType": { "WORK": 6, "LEARNING": 8 }
      }
    ],
    "dailyActivity": [
      { "date": "2024-04-15", "workCount": 2, "learnCount": 1 },
      { "date": "2024-04-16", "workCount": 0, "learnCount": 3 }
    ],
    "weeklyTrend": [
      { "week": "2024-W10", "avgScore": 6.8 },
      { "week": "2024-W11", "avgScore": 7.1 },
      { "week": "2024-W12", "avgScore": null },
      { "week": "2024-W13", "avgScore": 7.4 },
      { "week": "2024-W14", "avgScore": 7.6 },
      { "week": "2024-W15", "avgScore": 7.8 },
      { "week": "2024-W16", "avgScore": 8.0 },
      { "week": "2024-W17", "avgScore": 7.9 }
    ]
  },
  "meta": {}
}
```

### `GET /v1/entries/summary` controller endpoint
- Protected with `JwtAuthGuard`
- Query params validated with `ZodValidationPipe(summaryQuerySchema)` using `@Query()`
- **Must be registered before `GET /v1/entries/:id`** in the controller (NestJS routes match in declaration order — `/summary` would otherwise be consumed by `/:id`)

---

## Key Decisions

**Single endpoint for all dashboard data:** All dashboard widgets are served by one endpoint. This avoids 6–8 waterfall requests on dashboard load — the frontend makes one call and the entire dashboard populates. At MVP scale the query cost is acceptable; if performance becomes an issue later, the endpoint can be split and response-cached per user.

**`weeklyTrend` uses a fixed 8-week window regardless of `period`:** The `ProductivityTrend` chart always shows 8 weeks of history. Tying it to the period param would mean `period=7d` shows a near-empty chart. The trend window is independent of the activity summary period.

**Streak grace rule — today OR yesterday as the anchor:** If the user hasn't logged yet today, their streak should not appear broken. The `currentStreak` walk starts from today; if today has no entry, it falls back to yesterday as the start anchor. This matches the UX expectation that a streak is "still live" until midnight of the next day.

**`longestStreak` is all-time, not period-scoped:** Personal best is a lifetime stat. Scoping it to the selected period would make it lose meaning — a user's all-time best of 30 days shouldn't disappear when they switch to `7d` view.

**`dailyActivity` is period-scoped:** The `DailyChart` shows activity within the selected time window. Days with zero entries are omitted from the array — the frontend fills gaps visually.

**`byCategory` includes `color` from the parent category:** The category chart and sidebar use `color` to render swatches. Fetching categories by ID in Step 8 means `color` is available at no extra query cost.

**`groupBy` + in-memory join (not raw SQL):** Prisma's `groupBy` handles aggregations. Separate queries fetch category metadata. Two-query approach is slightly less efficient than raw SQL JOIN but stays in Prisma's type-safe API. MVP scale (hundreds to low thousands of entries) makes this a non-issue.

**Date filter on `entryDate`, not `createdAt`:** Consistent with the rest of the application — dashboard filters always use the user-assigned entry date.

**`averageProductivityScore: null` when no scores:** Returning `0` would be misleading. `null` signals "no data" — the frontend renders "N/A" or a dash.

---

## Done When

- `GET /v1/entries/summary` returns `totalEntries`, `totalByType`, `averageProductivityScore`, `byCategory`, `dailyActivity`, `weeklyTrend`, `thisWeekCount`, `lastWeekCount`, `currentStreak`, `longestStreak`
- `?period=7d` scopes `totalEntries`, `totalByType`, `averageProductivityScore`, `byCategory`, and `dailyActivity` to last 7 days — but `weeklyTrend`, `currentStreak`, and `longestStreak` remain full-history
- `?period=all` returns stats for all time
- `averageProductivityScore` is `null` when no entries in the period have scores
- `weeklyTrend` always returns exactly 8 entries, with `null` for weeks with no scored entries
- `currentStreak` correctly handles the grace rule (streak is live if user logged today or yesterday)
- `longestStreak` correctly identifies the all-time longest consecutive run
- `thisWeekCount` and `lastWeekCount` use ISO calendar week boundaries, not rolling 7-day windows
- Categories with no entries in the period are excluded from `byCategory`
- Totals match manual counts in the database
- `npm run test` covers: empty state, one category, multiple categories, all period options, streak calculation edge cases (today entry, yesterday entry, gap in history)
