interface HeroSplitWidgetProps {
  className?: string;
}

const WORK_PCT = 58;
const LEARN_PCT = 42;

export function HeroSplitWidget({ className = '' }: HeroSplitWidgetProps) {
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
          <div className="mb-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-[28px] font-bold leading-none tabular-nums text-gl-work">
              {WORK_PCT}%
            </span>
            <span className="text-[11px] font-medium text-gl-text-muted">Work</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gl-bg-subtle">
            <div
              className="h-full rounded-full opacity-85 animate-expand-x"
              style={{ width: `${WORK_PCT}%`, background: 'var(--gl-work-fg)' }}
            />
          </div>
        </div>

        <div className="h-10 w-px shrink-0 bg-gl-border" aria-hidden="true" />

        {/* Learning */}
        <div className="flex-1">
          <div className="mb-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-[28px] font-bold leading-none tabular-nums text-gl-primary">
              {LEARN_PCT}%
            </span>
            <span className="text-[11px] font-medium text-gl-text-muted">Learning</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gl-bg-subtle">
            <div
              className="h-full rounded-full opacity-90 animate-expand-x animation-delay-200"
              style={{ width: `${LEARN_PCT}%`, background: 'var(--gl-primary)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
