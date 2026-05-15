'use client';

import { useState, useEffect } from 'react';
import { DailyChart } from './daily-chart';
import { CategoryChart } from './category-chart';
import type { DailyActivity, MockCategory } from '@/data/dashboard-mock';

type Tab = 'daily' | 'category';

interface ActivityCardProps {
  daily: DailyActivity[];
  categories: MockCategory[];
}

const TABS: { key: Tab; label: string; mobileLabel: string }[] = [
  { key: 'daily',    label: 'Daily activity',     mobileLabel: 'Daily'      },
  { key: 'category', label: 'Category breakdown',  mobileLabel: 'Categories' },
];

export function ActivityCard({ daily, categories }: ActivityCardProps) {
  const [tab, setTab] = useState<Tab>('daily');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const chartData = isMobile ? daily.slice(-7) : daily;

  return (
    <div className="mb-4 overflow-visible rounded-xl border border-gl-border bg-gl-surface shadow-gl">
      {/* Header — Activity label left, tabs + legend right */}
      <div className="flex items-center justify-between px-4 pt-4 sm:px-[22px] sm:pt-[18px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
          Activity
        </p>

        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="inline-flex gap-1 rounded-[9px] border border-gl-border bg-gl-bg-subtle p-1">
            {TABS.map(({ key, label, mobileLabel }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-[6px] px-2.5 py-[6px] text-[11.5px] font-medium transition-colors duration-[120ms] sm:rounded-[6px] sm:px-3 sm:py-[7px] sm:text-[12.5px] ${
                  tab === key
                    ? 'border border-gl-border bg-gl-surface font-semibold text-gl-text shadow-gl'
                    : 'border border-transparent text-gl-text-muted hover:text-gl-text'
                }`}
              >
                <span className="sm:hidden">{mobileLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Legend — desktop only */}
          <div className="hidden sm:flex items-center gap-3.5 text-[12px] text-gl-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-[9px] rounded-[2px] bg-gl-work" aria-hidden="true" /> Work
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-[9px] rounded-[2px] bg-gl-learn" aria-hidden="true" /> Learning
            </span>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="p-4 sm:p-[22px]">
        {tab === 'daily' ? (
          <DailyChart data={chartData} />
        ) : (
          <CategoryChart categories={categories} />
        )}
      </div>
    </div>
  );
}
