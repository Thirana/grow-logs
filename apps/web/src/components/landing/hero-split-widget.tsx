'use client';

import { useFadeCycle } from '@/hooks/use-hero-cycle';

interface HeroSplitWidgetProps {
  className?: string;
}

const SPLITS = [
  { workPct: 58, learnPct: 42 },
  { workPct: 43, learnPct: 57 },
  { workPct: 65, learnPct: 35 },
  { workPct: 52, learnPct: 48 },
] as const;

// Bar width transitions via CSS; percentage numbers fade out/in when the split changes.
const BAR_TRANSITION = 'width 1.4s cubic-bezier(0.34, 1.2, 0.64, 1)';

export function HeroSplitWidget({ className = '' }: HeroSplitWidgetProps) {
  const { current: split, visible } = useFadeCycle(SPLITS, 6500, 500);

  return (
    <div
      className={`rounded-xl border border-gl-border bg-gl-surface p-5 shadow-gl transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg ${className}`}
    >
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
        Activity split · this month
      </p>

      <div className="flex items-end justify-between gap-4">
        {/* Work */}
        <div className="flex-1">
          <div
            className="mb-1.5 flex items-baseline gap-1.5 transition-opacity duration-[500ms]"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <span className="font-mono text-[28px] font-bold leading-none tabular-nums text-gl-work">
              {split.workPct}%
            </span>
            <span className="text-[11px] font-medium text-gl-text-muted">Work</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gl-bg-subtle">
            <div
              className="h-full rounded-full opacity-85"
              style={{
                width: `${split.workPct}%`,
                background: 'var(--gl-work-fg)',
                transition: BAR_TRANSITION,
              }}
            />
          </div>
        </div>

        <div className="h-10 w-px shrink-0 bg-gl-border" aria-hidden="true" />

        {/* Learning */}
        <div className="flex-1">
          <div
            className="mb-1.5 flex items-baseline gap-1.5 transition-opacity duration-[500ms]"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <span className="font-mono text-[28px] font-bold leading-none tabular-nums text-gl-primary">
              {split.learnPct}%
            </span>
            <span className="text-[11px] font-medium text-gl-text-muted">Learning</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gl-bg-subtle">
            <div
              className="h-full rounded-full opacity-90"
              style={{
                width: `${split.learnPct}%`,
                background: 'var(--gl-primary)',
                transition: BAR_TRANSITION,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
