'use client';

// TopBar — page header showing daily context (streak, date, today's categories).
// Used by: components/dashboard/dashboard-client.tsx
import { type JSX } from 'react';
import { IconTrendUp } from '@/components/common/icons';

export interface TodayCategory {
  name: string;
  swatchColor: string;
}

interface TopBarProps {
  streakDays: number;
  todayDate: string;
  todayCategories: TodayCategory[];
}

export function TopBar({ streakDays, todayDate, todayCategories }: TopBarProps): JSX.Element {
  return (
    <div className="border-gl-border border-b px-6 pt-7 pb-6 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        {/* Title + streak badge, date below */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-gl-text text-[26px] leading-tight font-bold tracking-[-0.022em] sm:text-[28px]">
              Dashboard
            </h1>
            {streakDays > 0 && (
              <div className="bg-gl-warning-soft inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5">
                <IconTrendUp size={12} className="text-gl-warning shrink-0" />
                <span className="text-gl-warning font-mono text-[15px] leading-none font-bold tabular-nums">
                  {streakDays}
                </span>
                <span className="text-gl-warning/75 text-[11px] leading-none font-semibold">
                  day streak
                </span>
              </div>
            )}
          </div>
          <p className="text-gl-text-muted mt-1.5 text-[13px]">{todayDate}</p>
        </div>

        {/* Today's logged categories — wraps below title on mobile, right-aligned on sm+ */}
        {todayCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-gl-text-muted text-[12px] font-medium">Today:</span>
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
    </div>
  );
}
