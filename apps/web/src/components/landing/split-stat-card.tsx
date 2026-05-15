interface SplitStatCardProps {
  workPct: number;
  learnPct: number;
}

export function SplitStatCard({ workPct, learnPct }: SplitStatCardProps) {
  return (
    <div className="border-gl-border bg-gl-surface rounded-xl border p-5">
      <p className="text-gl-text-muted text-[10.5px] font-bold tracking-[0.12em] uppercase">
        This month&apos;s split
      </p>

      <div className="mt-3.5 mb-2.5 flex items-baseline justify-between">
        <div>
          <span className="text-gl-work font-mono text-2xl font-bold tabular-nums">{workPct}%</span>
          <p className="text-gl-text-muted mt-1 text-[11px] font-medium">Work</p>
        </div>
        <div className="text-right">
          <span className="text-gl-primary font-mono text-2xl font-bold tabular-nums">
            {learnPct}%
          </span>
          <p className="text-gl-text-muted mt-1 text-[11px] font-medium">Learning</p>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="bg-gl-bg-subtle mt-2 flex h-2.5 overflow-hidden rounded-full">
        <div
          className="h-full opacity-85"
          style={{ width: `${workPct}%`, background: 'var(--gl-work-fg)' }}
        />
        <div
          className="h-full opacity-95"
          style={{ width: `${learnPct}%`, background: 'var(--gl-primary)' }}
        />
      </div>
    </div>
  );
}
