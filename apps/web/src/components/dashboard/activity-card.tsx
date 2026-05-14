'use client';

import { useState } from 'react';
import { DailyChart } from './daily-chart';
import { CategoryChart } from './category-chart';
import type { DailyActivity, MockCategory } from '@/data/dashboard-mock';

type Tab = 'daily' | 'category';

interface ActivityCardProps {
  daily: DailyActivity[];
  categories: MockCategory[];
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'daily', label: 'Daily activity' },
  { key: 'category', label: 'Category breakdown' },
];

export function ActivityCard({ daily, categories }: ActivityCardProps){
  const [tab, setTab] = useState<Tab>('daily');

  return (
    <div className="mb-4 overflow-visible rounded-xl border border-gl-border bg-gl-surface shadow-gl">
      {/* Header */}
      <div className="flex items-center justify-between px-[22px] pt-[18px]">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
            Activity
          </p>
          {/* Tab switcher */}
          <div className="inline-flex gap-1 rounded-[9px] border border-gl-border bg-gl-bg-subtle p-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-[6px] px-3 py-[7px] text-[12.5px] font-medium transition-colors duration-[120ms] ${
                  tab === key
                    ? 'border border-gl-border bg-gl-surface font-semibold text-gl-text shadow-gl'
                    : 'border border-transparent text-gl-text-muted hover:text-gl-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3.5 text-[12px] text-gl-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-[9px] rounded-[2px] bg-gl-work" aria-hidden="true" /> Work
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-[9px] rounded-[2px] bg-gl-primary" aria-hidden="true" /> Learning
          </span>
        </div>
      </div>

      {/* Chart area */}
      <div className="p-[22px]">
        {tab === 'daily' ? (
          <DailyChart data={daily} />
        ) : (
          <CategoryChart categories={categories} />
        )}
      </div>
    </div>
  );
}
