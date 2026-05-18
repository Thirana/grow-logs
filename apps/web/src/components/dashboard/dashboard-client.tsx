'use client';

// Dashboard orchestrator — fetches summary + entries, owns period state and sheet/dialog state.
// Used by: app/(dashboard)/dashboard/page.tsx
import { type JSX, useMemo, useState } from 'react';
import type { Entry } from '@grow-logs/types';

import { TopBar, type TodayCategory } from './top-bar';
import { StatsRow } from './stats-row';
import { StatsRowSkeleton } from './stats-row-skeleton';
import { ActivityCard } from './activity-card';
import { RecentEntries } from './recent-entries';
import { RecentEntriesSkeleton } from './recent-entries-skeleton';
import { ProductivityTrend } from './productivity-trend';
import { EntrySheet } from './entry-sheet';
import { useEntriesSummary, useEntries } from '@/hooks/use-entries';
import { useUiStore } from '@/stores/ui.store';

type Period = '7d' | '30d' | 'week' | 'month';

// YYYY-MM-DD in local time — avoids UTC midnight shifting the date.
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTodayDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

// Days elapsed in the selected period (past days only, so consistency % is meaningful).
function daysElapsed(period: Period): number {
  const today = new Date();
  if (period === '7d') return 7;
  if (period === '30d') return 30;
  if (period === 'week') {
    // Mon–Sun week: Mon=1 → 1 elapsed, Sun=0 → 7 elapsed
    const dow = today.getDay();
    return dow === 0 ? 7 : dow;
  }
  // month: day of month (1–31)
  return today.getDate();
}

interface StatsRowErrorProps {
  onRetry: () => void;
}

function StatsRowError({ onRetry }: StatsRowErrorProps): JSX.Element {
  return (
    <div className="border-gl-border bg-gl-surface shadow-gl mb-4 flex items-center justify-between rounded-xl border p-5">
      <p className="text-gl-text-muted text-[13px]">Failed to load stats.</p>
      <button
        onClick={onRetry}
        className="text-gl-primary hover:text-gl-primary-hover text-[13px] font-semibold underline-offset-2 hover:underline"
      >
        Retry
      </button>
    </div>
  );
}

export function DashboardClient(): JSX.Element {
  const [period, setPeriod] = useState<Period>('30d');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const { isCreatingEntry, openCreateEntry, closeCreateEntry } = useUiStore();
  const sheetOpen = isCreatingEntry || selectedEntry !== null;

  function handleSheetClose() {
    closeCreateEntry();
    setSelectedEntry(null);
  }

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useEntriesSummary(period);

  const { data: entriesResult, isLoading: entriesLoading } = useEntries({
    page: 1,
    limit: 10,
  });

  // Derive today's categories from the recent entries list.
  const todayIso = localDateStr(new Date());
  const todayCategories = useMemo<TodayCategory[]>(() => {
    const entries = entriesResult?.data ?? [];
    const seen = new Set<string>();
    const result: TodayCategory[] = [];
    for (const e of entries) {
      if (e.entryDate.slice(0, 10) === todayIso && !seen.has(e.categoryId)) {
        seen.add(e.categoryId);
        result.push({ name: e.category.name, swatchColor: e.category.color });
      }
    }
    return result;
  }, [entriesResult, todayIso]);

  const workPct =
    summary && summary.totalEntries > 0
      ? Math.round((summary.totalByType.WORK / summary.totalEntries) * 100)
      : 0;
  const learnPct = summary ? 100 - workPct : 0;
  const trendData = summary?.weeklyTrend.map((w) => w.avgScore) ?? [];

  // Days active: unique days with at least one entry in the selected period.
  const daysActive = summary?.dailyActivity.length ?? 0;
  const totalDaysInPeriod = daysElapsed(period);

  return (
    <>
      <TopBar
        period={period}
        onPeriodChange={setPeriod}
        onAddEntry={openCreateEntry}
        streakDays={summary?.currentStreak ?? 0}
        todayDate={formatTodayDate()}
        todayCategories={todayCategories}
      />

      <div className="flex-1 px-8 py-6 pb-16">
        {summaryLoading ? (
          <StatsRowSkeleton />
        ) : summaryError ? (
          <StatsRowError onRetry={() => void refetchSummary()} />
        ) : summary ? (
          <StatsRow
            totalEntries={summary.totalEntries}
            thisWeekCount={summary.thisWeekCount}
            lastWeekCount={summary.lastWeekCount}
            workPct={workPct}
            learnPct={learnPct}
            avgProductivity={summary.averageProductivityScore}
            daysActive={daysActive}
            totalDaysInPeriod={totalDaysInPeriod}
            period={period}
          />
        ) : null}

        <ActivityCard
          dailyActivity={summary?.dailyActivity ?? []}
          byCategory={summary?.byCategory ?? []}
          period={period}
        />

        {entriesLoading ? (
          <RecentEntriesSkeleton />
        ) : (
          <RecentEntries
            entries={entriesResult?.data ?? []}
            onAddEntry={openCreateEntry}
            onEdit={(entry) => setSelectedEntry(entry)}
          />
        )}

        <ProductivityTrend data={trendData} />

        <div className="border-gl-border text-gl-text-faint mt-6 flex items-center justify-between border-t pt-5 text-[12px]">
          <span>Last sync · just now</span>
        </div>
      </div>

      <EntrySheet open={sheetOpen} onClose={handleSheetClose} entry={selectedEntry ?? undefined} />
    </>
  );
}
