'use client';

import { type JSX, useState } from 'react';
import { TopBar } from './top-bar';
import { StatsRow } from './stats-row';
import { StatsRowSkeleton } from './stats-row-skeleton';
import { ActivityCard } from './activity-card';
import { RecentEntries } from './recent-entries';
import { RecentEntriesSkeleton } from './recent-entries-skeleton';
import { ProductivityTrend } from './productivity-trend';
import { AddEntrySheet } from './add-entry-sheet';
import { useEntriesSummary, useEntries } from '@/hooks/use-entries';

type Period = '7d' | '30d' | 'all';

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
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const workPct =
    summary && summary.totalEntries > 0
      ? Math.round((summary.totalByType.WORK / summary.totalEntries) * 100)
      : 0;
  const learnPct = summary ? 100 - workPct : 0;
  const trendData = summary?.weeklyTrend.map((w) => w.avgScore) ?? [];

  return (
    <>
      <TopBar period={period} onPeriodChange={setPeriod} onAddEntry={() => setSheetOpen(true)} />

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
            currentStreak={summary.currentStreak}
            longestStreak={summary.longestStreak}
            period={period}
          />
        ) : null}

        <ActivityCard
          dailyActivity={summary?.dailyActivity ?? []}
          byCategory={summary?.byCategory ?? []}
        />

        {entriesLoading ? (
          <RecentEntriesSkeleton />
        ) : (
          <RecentEntries
            entries={entriesResult?.data ?? []}
            onAddEntry={() => setSheetOpen(true)}
          />
        )}

        <ProductivityTrend data={trendData} />

        <div className="border-gl-border text-gl-text-faint mt-6 flex items-center justify-between border-t pt-5 text-[12px]">
          <span>Last sync · just now</span>
        </div>
      </div>

      <AddEntrySheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
