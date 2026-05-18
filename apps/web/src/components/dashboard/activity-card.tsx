'use client';

import { useState, useEffect } from 'react';
import { DailyChart } from './daily-chart';
import { CategoryChart } from './category-chart';
import type { CategorySummaryItem } from '@grow-logs/types';

type Tab = 'daily' | 'category';

interface DailyPoint {
  date: string;
  workCount: number;
  learnCount: number;
}

interface ActivityCardProps {
  dailyActivity: DailyPoint[];
  byCategory: CategorySummaryItem[];
}

const TABS: { key: Tab; label: string; mobileLabel: string }[] = [
  { key: 'daily', label: 'Daily activity', mobileLabel: 'Daily' },
  { key: 'category', label: 'Category breakdown', mobileLabel: 'Categories' },
];

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${iso}T00:00:00`),
  );
}

export function ActivityCard({ dailyActivity, byCategory }: ActivityCardProps) {
  const [tab, setTab] = useState<Tab>('daily');
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const raw = isMobile ? dailyActivity.slice(-7) : dailyActivity;
  const chartData = raw.map((d, i, arr) => ({
    dateLabel: i === 0 || i % 7 === 0 || i === arr.length - 1 ? formatShortDate(d.date) : '',
    workCount: d.workCount,
    learnCount: d.learnCount,
  }));

  return (
    <div className="border-gl-border bg-gl-surface shadow-gl mb-4 overflow-visible rounded-xl border">
      <div className="flex items-center justify-between px-4 pt-4 sm:px-[22px] sm:pt-[18px]">
        <p className="text-gl-text-faint text-[11px] font-bold tracking-[0.12em] uppercase">
          Activity
        </p>

        <div className="flex items-center gap-3">
          <div className="border-gl-border bg-gl-bg-subtle inline-flex gap-1 rounded-[9px] border p-1">
            {TABS.map(({ key, label, mobileLabel }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-[6px] px-2.5 py-[6px] text-[11.5px] font-medium transition-colors duration-[120ms] sm:rounded-[6px] sm:px-3 sm:py-[7px] sm:text-[12.5px] ${
                  tab === key
                    ? 'border-gl-border bg-gl-surface text-gl-text shadow-gl border font-semibold'
                    : 'text-gl-text-muted hover:text-gl-text border border-transparent'
                }`}
              >
                <span className="sm:hidden">{mobileLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="text-gl-text-muted hidden items-center gap-3.5 text-[12px] sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="bg-gl-work size-[9px] rounded-[2px]" aria-hidden="true" /> Work
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-gl-learn size-[9px] rounded-[2px]" aria-hidden="true" /> Learning
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-[22px]">
        {tab === 'daily' ? (
          <DailyChart data={chartData} />
        ) : (
          <CategoryChart categories={byCategory} />
        )}
      </div>
    </div>
  );
}
