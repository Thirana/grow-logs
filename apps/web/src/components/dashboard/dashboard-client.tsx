'use client';

import { useState } from 'react';
import { TopBar } from './top-bar';
import { StatsRow } from './stats-row';
import { ActivityCard } from './activity-card';
import { RecentEntries } from './recent-entries';
import { ProductivityTrend } from './productivity-trend';
import { AddEntrySheet } from './add-entry-sheet';
import type { DashboardStats, MockEntry, MockCategory, DailyActivity } from '@/data/dashboard-mock';

type Period = '7d' | '30d' | 'all';

interface DashboardClientProps {
  stats: DashboardStats;
  entries: MockEntry[];
  categories: MockCategory[];
  daily: DailyActivity[];
  trend: (number | null)[];
}

export function DashboardClient({
  stats, entries, categories, daily, trend,
}: DashboardClientProps){
  const [period, setPeriod] = useState<Period>('30d');
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <TopBar
        period={period}
        onPeriodChange={setPeriod}
        onAddEntry={() => setSheetOpen(true)}
      />

      <div className="flex-1 px-8 py-6 pb-16">
        <StatsRow stats={stats} />
        <ActivityCard daily={daily} categories={categories} />
        <RecentEntries entries={entries} onAddEntry={() => setSheetOpen(true)} />
        <ProductivityTrend data={trend} />

        <div className="mt-6 flex items-center justify-between border-t border-gl-border pt-5 text-[12px] text-gl-text-faint">
          <span>Last sync · just now</span>
        </div>
      </div>

      <AddEntrySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
      />
    </>
  );
}
