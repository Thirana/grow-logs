'use client';

import { IconPlus, IconTrendUp } from '@/components/common/icons';

type Period = '7d' | '30d' | 'week' | 'month';

export interface TodayCategory {
  name: string;
  swatchColor: string;
}

interface TopBarProps {
  period: Period;
  onPeriodChange: (p: Period) => void;
  onAddEntry: () => void;
  streakDays: number;
  todayDate: string;
  todayCategories: TodayCategory[];
}

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
];

export function TopBar({
  period,
  onPeriodChange,
  onAddEntry,
  streakDays,
  todayDate,
  todayCategories,
}: TopBarProps) {
  return (
    <div className="border-gl-border bg-gl-bg sticky top-0 z-10 border-b px-8 py-5">
      <div className="flex items-start justify-between gap-6">
        {/* Left: title + streak + date + today chips */}
        <div className="min-w-0">
          {/* Title row with streak badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-gl-text text-[24px] leading-tight font-bold tracking-[-0.022em]">
              Dashboard
            </h1>

            {streakDays > 0 && (
              <div className="bg-gl-warning-soft inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5">
                <IconTrendUp size={12} className="text-gl-warning shrink-0" />
                <span className="text-gl-warning font-mono text-[16px] leading-none font-bold tabular-nums">
                  {streakDays}
                </span>
                <span className="text-gl-warning/75 text-[11px] leading-none font-semibold">
                  {streakDays === 1 ? 'day streak' : 'day streak'}
                </span>
              </div>
            )}
          </div>

          {/* Date */}
          <p className="text-gl-text-muted mt-1.5 text-[13px]">{todayDate}</p>

          {/* Today's logged categories */}
          {todayCategories.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-gl-text-faint text-[11px]">Today:</span>
              {todayCategories.map((cat) => (
                <span
                  key={cat.name}
                  className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold"
                  style={{ backgroundColor: cat.swatchColor, color: 'rgba(12,10,5,0.82)' }}
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: period selector + add button */}
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          <div className="border-gl-border bg-gl-bg-subtle inline-flex items-center gap-1 rounded-[9px] border p-1">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onPeriodChange(key)}
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
