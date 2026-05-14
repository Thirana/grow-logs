interface SplitStatCardProps {
  workPct: number;
  learnPct: number;
}

export function SplitStatCard({ workPct, learnPct }: SplitStatCardProps) {
  return (
    <div className="rounded-xl border border-gl-border bg-gl-surface p-5">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-gl-text-muted">
        This month's split
      </p>

      <div className="mt-3.5 mb-2.5 flex items-baseline justify-between">
        <div>
          <span className="font-mono text-2xl font-bold tabular-nums text-gl-work">
            {workPct}%
          </span>
          <p className="mt-1 text-[11px] font-medium text-gl-text-muted">Work</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-2xl font-bold tabular-nums text-gl-primary">
            {learnPct}%
          </span>
          <p className="mt-1 text-[11px] font-medium text-gl-text-muted">Learning</p>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-gl-bg-subtle">
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
