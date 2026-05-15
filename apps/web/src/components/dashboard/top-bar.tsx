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
  { key: '7d',  label: '7 days'  },
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
    <div className="sticky top-0 z-10 border-b border-gl-border bg-gl-bg px-8 py-5">
      <div className="flex items-start justify-between gap-6">

        {/* Left: title + date + today's categories */}
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold leading-tight tracking-[-0.022em] text-gl-text">
            Dashboard
          </h1>

          {/* Date + streak on the same line */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-gl-text-muted">{todayDate}</span>

            <span
              className="inline-flex items-center gap-1 rounded-full bg-gl-warning-soft px-2.5 py-[4px] text-[11.5px] font-bold text-gl-warning"
              title={`Current streak: ${streakDays} days`}
            >
              <IconTrendUp size={10} />
              {streakDays}-day streak
            </span>
          </div>

          {/* Today's logged categories */}
          {todayCategories.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-gl-text-faint">Today:</span>
              {todayCategories.map((cat) => (
                <span
                  key={cat.name}
                  className="inline-flex items-center gap-1 rounded-full border border-gl-border bg-gl-surface px-2 py-0.5 text-[11.5px] font-medium text-gl-text-muted"
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
          <div className="inline-flex items-center gap-1 rounded-[10px] border border-gl-border bg-gl-bg-subtle p-1">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onPeriodChange(key)}
                className={`rounded-[7px] px-3 py-[7px] text-[12.5px] font-medium whitespace-nowrap transition-colors duration-[120ms] ${
                  period === key
                    ? 'border border-gl-border bg-gl-surface font-semibold text-gl-text shadow-gl'
                    : 'border border-transparent text-gl-text-muted hover:text-gl-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={onAddEntry}
            className="inline-flex items-center gap-2 rounded-[10px] bg-gl-primary-soft px-4 py-2.5 text-[13.5px] font-semibold whitespace-nowrap text-gl-primary transition-colors hover:bg-gl-primary-soft/80"
          >
            <IconPlus size={13} /> Add entry
          </button>
        </div>
      </div>
    </div>
  );
}
