# Step F06 — Dashboard Wired — Stats & Summary

**Phase:** 3  
**Status:** ⬜ Not started  
**Depends on:** F05 (authenticated, onboarded user lands on dashboard)

---

## Goal

Replace the mock stats and summary data with a real React Query hook that calls `GET /entries/summary`. Wire `StatsRow` to live data. Introduce loading skeletons for the stats area.

---

## What to Build

### Types: `packages/types/src/index.ts`

Add entry summary types:

```typescript
export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  isCompleted: boolean;
  totalEntries: number;
  workEntries: number;
  learningEntries: number;
  avgProductivityScore: number | null;
}

export interface EntrySummary {
  period: '7d' | '30d' | 'all';
  totalEntries: number;
  workEntries: number;
  learningEntries: number;
  avgProductivityScore: number | null;
  currentStreak: number;
  longestStreak: number;
  categories: CategorySummary[];
  weeklyTrend: (number | null)[];
}
```

### Hook: `hooks/use-entries.ts`

Create the file with only the summary hook for now (entries list added in F07):

```typescript
export function useEntriesSummary(period: '7d' | '30d' | 'all'): UseQueryResult<EntrySummary, ApiError>
```

- Query key: `['entries', 'summary', period]`
- Calls `GET /entries/summary?period=<period>`
- The response envelope is `{ data: EntrySummary, meta: {} }` — extract `response.data.data`
- `staleTime: 60_000` — summary is expensive to compute, cache for 60s before refetching

### Dashboard Page Rewrite

`app/(dashboard)/dashboard/page.tsx`:
- Remove MOCK_STATS import
- Pass no stats props to `DashboardClient` — data is fetched inside now

`components/dashboard/dashboard-client.tsx`:
- Call `useEntriesSummary(period)` inside the component
- Pass summary data down to `StatsRow` using the real `EntrySummary` type
- While loading: render `StatsRowSkeleton` in place of `StatsRow`
- While error: render a small error message in the stats area with a "Retry" button that calls `refetch()`

### Component: `components/dashboard/stats-row-skeleton.tsx`

Three placeholder stat card shapes with pulsing `bg-gl-border/50 animate-pulse` backgrounds. Matches the visual weight of the real `StatsRow` so the layout does not shift on load.

### `StatsRow` Interface Update

`components/dashboard/stats-row.tsx`:
- Update the `stats` prop type from `DashboardStats` (mock interface) to accept the fields from `EntrySummary` directly. Only map the fields that `StatsRow` actually renders — do not pass the entire summary object.

The stat cards display:
- Total entries this period
- Work % vs Learning %
- Average productivity score
- Current streak + longest streak

Map from `EntrySummary`:
```typescript
interface StatsRowProps {
  totalEntries: number;
  workPct: number;    // computed: Math.round((workEntries / totalEntries) * 100)
  learnPct: number;   // computed: 100 - workPct
  avgProductivity: number | null;
  currentStreak: number;
  longestStreak: number;
}
```

The computation (`workPct`, `learnPct`) happens in `DashboardClient` before passing to `StatsRow` — keep the presentational component dumb.

---

## Files Created or Modified

| File | Action |
|---|---|
| `app/(dashboard)/dashboard/page.tsx` | Modify — remove MOCK_STATS |
| `components/dashboard/dashboard-client.tsx` | Modify — add `useEntriesSummary`, render skeleton |
| `components/dashboard/stats-row.tsx` | Modify — update prop types |
| `components/dashboard/stats-row-skeleton.tsx` | Create |
| `hooks/use-entries.ts` | Create |
| `packages/types/src/index.ts` | Modify — add `EntrySummary`, `CategorySummary` |

---

## Done When

- [ ] Stats row renders real data from `GET /entries/summary`
- [ ] Period switcher (7d / 30d / all) triggers a new summary fetch and updates the stats
- [ ] `StatsRowSkeleton` is shown while the summary is loading
- [ ] Error state shown with a retry option if the API call fails
- [ ] `npm run typecheck` passes (no references to mock `DashboardStats` type in this area)
- [ ] `npm test` passes
