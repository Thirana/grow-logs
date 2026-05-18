# Step F07 — Dashboard Wired — Entries List & Charts

**Phase:** 3  
**Status:** ⬜ Not started  
**Depends on:** F06 (`hooks/use-entries.ts` exists, `EntrySummary` type defined)

---

## Goal

Wire the recent entries list and charts to live data. Delete `data/dashboard-mock.ts` once all dashboard sections are off mock data.

---

## What to Build

### Types: `packages/types/src/index.ts`

Add entry types:

```typescript
export interface Entry {
  id: string;
  type: 'WORK' | 'LEARNING';
  text: string;
  score: number | null;
  entryDate: string;          // ISO date string: "2025-05-16"
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  createdAt: string;
}

export interface EntryListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Hook: `hooks/use-entries.ts`

Add `useEntries` to the existing file:

```typescript
export interface EntryListParams {
  page?: number;
  limit?: number;
  type?: 'WORK' | 'LEARNING';
  categoryId?: string;
  from?: string;
  to?: string;
}

export function useEntries(params: EntryListParams): UseQueryResult<{ data: Entry[]; meta: EntryListMeta }, ApiError>
```

- Query key: `['entries', params]`
- Calls `GET /entries` with params as query string
- `staleTime: 30_000`

### `RecentEntries` Update

`components/dashboard/recent-entries.tsx`:
- Replace `MockEntry[]` prop with `Entry[]` from `packages/types`
- While loading: render `RecentEntriesSkeleton`
- Empty state: shown when entries array is empty

`DashboardClient` passes `entries` from `useEntries({ page: 1, limit: 10 })`.

### Component: `components/dashboard/recent-entries-skeleton.tsx`

Three placeholder entry row shapes with pulsing backgrounds. Same height as a real entry row.

### `EntryRow` Update

`components/dashboard/entry-row.tsx`:
- Replace `MockEntry` prop type with `Entry` from `packages/types`
- The `type` badge maps `'WORK'` → `TypeBadge` (already handles this)
- `score` is `number | null` — show score pill only when not null
- Date display: format `entryDate` as "May 16" using `Intl.DateTimeFormat`
- Category name comes from `entry.categoryName` (string, not a colour lookup)

**Note on swatch colours:** The mock data had `swatchColor` per entry. Real entries only have `categoryId` and `categoryName`. Swatch colour assignment for the real app should use a deterministic colour from the category ID (e.g., hash the first character into one of 5 CSS variables `--gl-swatch-1` through `--gl-swatch-5`). Add a `getCategorySwatchVar(categoryId: string): string` utility in `lib/utils.ts`.

### Charts: `ActivityCard` + `ProductivityTrend`

`components/dashboard/activity-card.tsx`:
- Currently receives `MOCK_DAILY` and `MOCK_CATEGORIES`. Real data comes from `EntrySummary.categories` (already fetched in F06).
- The `weeklyActivity` breakdown (work vs learn by day) is not directly in the summary endpoint. For now, use `categories` data to render the category breakdown chart.
- Remove `DailyActivity` mock dependency.

`components/dashboard/productivity-trend.tsx`:
- Receives `trend: (number | null)[]`. Real data: `EntrySummary.weeklyTrend` (already fetched in F06, passed down through `DashboardClient`).
- No changes needed to the chart rendering logic — just update the prop source.

### Mock Data Cleanup

Once all sections are off mock data:
- Delete `data/dashboard-mock.ts`
- Remove any remaining mock type imports from dashboard components
- Keep any static data used exclusively by the landing page `LivePreview` component — that component uses its own inline constants, not the mock file

### `DashboardPage` cleanup

`app/(dashboard)/dashboard/page.tsx`:
- Remove all remaining `MOCK_*` imports
- The page should import nothing from `data/dashboard-mock.ts`

---

## Files Created or Modified

| File | Action |
|---|---|
| `app/(dashboard)/dashboard/page.tsx` | Modify — remove all mock imports |
| `components/dashboard/dashboard-client.tsx` | Modify — add `useEntries`, pass real data to all components |
| `components/dashboard/recent-entries.tsx` | Modify — update prop type |
| `components/dashboard/recent-entries-skeleton.tsx` | Create |
| `components/dashboard/entry-row.tsx` | Modify — update prop type, add colour utility |
| `components/dashboard/activity-card.tsx` | Modify — remove mock dependency |
| `components/dashboard/productivity-trend.tsx` | Modify — remove mock dependency |
| `hooks/use-entries.ts` | Modify — add `useEntries` |
| `packages/types/src/index.ts` | Modify — add `Entry`, `EntryListMeta` |
| `lib/utils.ts` | Modify — add `getCategorySwatchVar` |
| `data/dashboard-mock.ts` | **Delete** |

---

## Done When

- [ ] Recent entries list renders real entries from `GET /entries`
- [ ] Entries with no score show no score pill
- [ ] Entry dates are formatted as human-readable strings
- [ ] Charts render using data from `EntrySummary` (no mock data)
- [ ] Loading skeletons shown while entries are fetching
- [ ] Empty state shown when user has no entries
- [ ] `data/dashboard-mock.ts` is deleted — no build errors
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
