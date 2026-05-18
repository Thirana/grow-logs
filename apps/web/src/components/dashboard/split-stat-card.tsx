import { type JSX } from 'react';
import { cn } from '@/lib/utils';

interface SplitStatCardProps {
  workPct: number;
  learnPct: number;
  label?: string;
  className?: string;
}

export function SplitStatCard({
  workPct,
  learnPct,
  label = "This month's split",
  className,
}: SplitStatCardProps): JSX.Element {
  return (
    <div
      className={cn('border-gl-border bg-gl-surface shadow-gl rounded-xl border p-5', className)}
    >
      <p className="text-gl-text-faint text-[11px] font-bold tracking-[0.12em] uppercase">
        {label}
      </p>

      <div className="mt-3.5 mb-2.5 flex items-baseline justify-between">
        <div>
          <div className="text-gl-work font-mono text-[24px] leading-none font-bold tabular-nums">
            {workPct}%
          </div>
          <div className="text-gl-text-muted mt-1 text-[11px]">Work</div>
        </div>
        <div className="text-right">
          <div className="text-gl-learn font-mono text-[24px] leading-none font-bold tabular-nums">
            {learnPct}%
          </div>
          <div className="text-gl-text-muted mt-1 text-[11px]">Learning</div>
        </div>
      </div>

      <div className="bg-gl-bg-subtle mt-2 flex h-2.5 overflow-hidden rounded-full">
        <div className="bg-gl-work" style={{ width: `${workPct}%`, opacity: 0.85 }} />
        <div className="bg-gl-learn" style={{ width: `${learnPct}%`, opacity: 0.95 }} />
      </div>
    </div>
  );
}
