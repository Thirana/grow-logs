'use client';

import { IconPlus, IconTrendUp } from '@/components/common/icons';

type Period = '7d' | '30d' | 'all';

interface TodayCategory {
  name: string;
  swatchColor: string;
}

interface TopBarProps {
  period: Period;
  onPeriodChange: (p: Period) => void;
  onAddEntry: () => void;
  streakDays?: number;
  todayDate?: string;
  todayCategories?: TodayCategory[];
}

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
];

// Placeholder values — replaced by real API data once auth is wired up
const DEFAULT_STREAK = 9;
const DEFAULT_DATE = 'Thursday, 15 May';
const DEFAULT_TODAY_CATEGORIES: TodayCategory[] = [
  { name: 'Backend', swatchColor: '#69B598' },
  { name: 'Reading', swatchColor: '#B87DA2' },
];

export function TopBar({
  period,
  onPeriodChange,
  onAddEntry,
  streakDays = DEFAULT_STREAK,
  todayDate = DEFAULT_DATE,
  todayCategories = DEFAULT_TODAY_CATEGORIES,
}: TopBarProps) {
  return (
    <div className="border-gl-border bg-gl-bg sticky top-0 z-10 border-b px-8 py-5">
      <div className="flex items-start justify-between gap-6">
        {/* Left: title + date + today's categories */}
        <div className="min-w-0">
          <h1 className="text-gl-text text-[24px] leading-tight font-bold tracking-[-0.022em]">
            Dashboard
          </h1>

          {/* Date + streak on the same line */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-gl-text-muted text-[13px]">{todayDate}</span>

            <span
              className="bg-gl-warning-soft text-gl-warning inline-flex items-center gap-1 rounded-full px-2.5 py-[4px] text-[11.5px] font-bold"
              title={`Current streak: ${streakDays} days`}
            >
              <IconTrendUp size={10} />
              {streakDays}-day streak
            </span>
          </div>

          {/* Today's logged categories */}
          {todayCategories.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-gl-text-faint text-[11px]">Today:</span>
              {todayCategories.map((cat) => (
                <span
                  key={cat.name}
                  className="border-gl-border bg-gl-surface text-gl-text-muted inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium"
                >
                  <span
                    className="size-[6px] shrink-0 rounded-full"
                    style={{ background: cat.swatchColor }}
                    aria-hidden="true"
                  />
                  {cat.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: period selector + add button */}
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          <div className="border-gl-border bg-gl-bg-subtle inline-flex items-center gap-1 rounded-[10px] border p-1">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onPeriodChange(key)}
                className={`rounded-[7px] px-3 py-[7px] text-[12.5px] font-medium whitespace-nowrap transition-colors duration-[120ms] ${
                  period === key
                    ? 'border-gl-border bg-gl-surface text-gl-text shadow-gl border font-semibold'
                    : 'text-gl-text-muted hover:text-gl-text border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={onAddEntry}
            className="bg-gl-primary-soft text-gl-primary hover:bg-gl-primary-soft/80 inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors"
          >
            <IconPlus size={13} /> Add entry
          </button>
        </div>
      </div>
    </div>
  );
}
