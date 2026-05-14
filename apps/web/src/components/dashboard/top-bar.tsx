'use client';

import { IconPlus } from '@/components/common/icons';

type Period = '7d' | '30d' | 'all';

interface TopBarProps {
  period: Period;
  onPeriodChange: (p: Period) => void;
  onAddEntry: () => void;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d',  label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
];

export function TopBar({ period, onPeriodChange, onAddEntry }: TopBarProps){
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gl-border bg-gl-bg px-8 py-[22px]">
      {/* Title */}
      <div>
        <h1 className="text-[24px] font-bold leading-tight tracking-[-0.022em] text-gl-text">
          Dashboard
        </h1>
        <p className="mt-1 text-[13px] text-gl-text-muted">
          Thursday, 15 May · 12-day streak going
        </p>
      </div>

      {/* Period selector */}
      <div className="inline-flex items-center gap-1 rounded-[10px] border border-gl-border bg-gl-bg-subtle p-1">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onPeriodChange(key)}
            className={`rounded-[7px] px-3 py-[7px] text-[12.5px] font-medium transition-colors duration-[120ms] whitespace-nowrap ${
              period === key
                ? 'border border-gl-border bg-gl-surface font-semibold text-gl-text shadow-gl'
                : 'border border-transparent text-gl-text-muted hover:text-gl-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add entry */}
      <button
        onClick={onAddEntry}
        className="inline-flex items-center gap-2 rounded-[10px] bg-gl-primary-soft px-4 py-2.5 text-[13.5px] font-semibold text-gl-primary transition-colors hover:bg-gl-primary-soft/80 whitespace-nowrap"
      >
        <IconPlus size={13} /> Add entry
      </button>
    </div>
  );
}
