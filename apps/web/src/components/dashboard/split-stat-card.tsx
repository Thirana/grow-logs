interface SplitStatCardProps {
  workPct: number;
  learnPct: number;
  className?: string;
}

export function SplitStatCard({ workPct, learnPct, className }: SplitStatCardProps){
  return (
    <div className={`rounded-xl border border-gl-border bg-gl-surface p-5 shadow-gl ${className ?? ''}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
        This month&apos;s split
      </p>

      <div className="mt-3.5 mb-2.5 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[24px] font-bold leading-none tabular-nums text-gl-work">
            {workPct}%
          </div>
          <div className="mt-1 text-[11px] text-gl-text-muted">Work</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[24px] font-bold leading-none tabular-nums text-gl-learn">
            {learnPct}%
          </div>
          <div className="mt-1 text-[11px] text-gl-text-muted">Learning</div>
        </div>
      </div>

      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-gl-bg-subtle">
        <div
          className="bg-gl-work"
          style={{ width: `${workPct}%`, opacity: 0.85 }}
        />
        <div
          className="bg-gl-learn"
          style={{ width: `${learnPct}%`, opacity: 0.95 }}
        />
      </div>
    </div>
  );
}
