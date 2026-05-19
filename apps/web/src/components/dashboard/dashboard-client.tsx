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
import { ActivityHeatmaps } from './activity-heatmaps';
import { EntrySheet } from './entry-sheet';
import { useEntriesSummary, useEntries } from '@/hooks/use-entries';
import { useUiStore } from '@/stores/ui.store';
import { IconPlus } from '@/components/common/icons';

type Period = '7d' | '30d' | 'week' | 'month';

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
];

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

// ── Section header: accent bar · title · extending rule · optional right slot ──

interface SectionHeaderProps {
  title: string;
  right?: React.ReactNode;
}

function SectionHeader({ title, right }: SectionHeaderProps): JSX.Element {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="bg-gl-primary h-[18px] w-[3px] rounded-full" />
        <h2 className="text-gl-text text-[15px] font-bold tracking-[-0.015em]">{title}</h2>
      </div>
      <div className="border-gl-border min-w-0 flex-1 border-t" />
      {right}
    </div>
  );
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
    isFetching: summaryFetching,
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
  const daysActive = summary?.dailyActivity.length ?? 0;
  const totalDaysInPeriod = daysElapsed(period);

  const periodPicker = (
    <div className="border-gl-border bg-gl-bg-subtle inline-flex shrink-0 items-center gap-1 rounded-[9px] border p-1">
      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setPeriod(key)}
          className={`rounded-[7px] px-3 py-[7px] text-[12.5px] font-medium whitespace-nowrap transition-colors duration-[120ms] ${
            period === key
              ? 'bg-gl-primary text-gl-primary-ink font-semibold'
              : 'text-gl-text-muted hover:text-gl-text'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const addEntryButton = (
    <button
      onClick={openCreateEntry}
      className="border-gl-primary text-gl-primary hover:bg-gl-primary-soft inline-flex shrink-0 items-center gap-1.5 rounded-[8px] border px-3 py-[7px] text-[12.5px] font-semibold transition-colors duration-[120ms]"
    >
      <IconPlus size={12} /> Add entry
    </button>
  );

  return (
    <>
      <TopBar
        streakDays={summary?.currentStreak ?? 0}
        todayDate={formatTodayDate()}
        todayCategories={todayCategories}
      />

      <div className="flex-1 px-8 py-8 pb-20">
        {/* ── Section 1: Overview ──────────────────────────────────────────── */}
        <SectionHeader title="Overview" right={periodPicker} />
        <div
          className={`transition-opacity duration-200 ${
            summaryFetching && !summaryLoading ? 'opacity-60' : 'opacity-100'
          }`}
        >
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
        </div>

        {/* ── Section 2: Recent entries ────────────────────────────────────── */}
        <div className="mt-12">
          <SectionHeader title="Recent entries" right={addEntryButton} />
          {entriesLoading ? (
            <RecentEntriesSkeleton />
          ) : (
            <RecentEntries
              entries={entriesResult?.data ?? []}
              onAddEntry={openCreateEntry}
              onEdit={(entry) => setSelectedEntry(entry)}
            />
          )}
        </div>

        {/* ── Section 3: Activity patterns ─────────────────────────────────── */}
        <div className="mt-12">
          <SectionHeader title="Activity patterns" />
          <ActivityHeatmaps />
        </div>
      </div>

      <EntrySheet open={sheetOpen} onClose={handleSheetClose} entry={selectedEntry ?? undefined} />
    </>
  );
}
