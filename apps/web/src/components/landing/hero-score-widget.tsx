interface HeroScoreWidgetProps {
  className?: string;
}

// Arc math: r=36, 270° arc on a 100×100 viewBox
// Circumference = 2π×36 = 226.19 · 270°/360° × 226.19 = 169.65 (track dasharray)
// 7.4/10 = 74% of 169.65 = 125.54 filled · dashoffset end = 169.65 − 125.54 = 44.11
// rotate(135, 50, 50) positions the 90° gap at the bottom

export function HeroScoreWidget({ className = '' }: HeroScoreWidgetProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-gl-border bg-gl-surface p-5 text-center shadow-gl transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
        Avg productivity
      </p>

      <div className="relative inline-flex items-center justify-center">
        <svg width="108" height="108" viewBox="0 0 100 100" aria-hidden="true">
          {/* Track */}
          <circle
            cx="50" cy="50" r="36"
            fill="none"
            stroke="var(--gl-bg-subtle)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="169.65 226.19"
            transform="rotate(135 50 50)"
          />
          {/* Fill — animates via gl-arc-draw keyframe */}
          <circle
            cx="50" cy="50" r="36"
            fill="none"
            stroke="var(--gl-primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="169.65"
            strokeDashoffset="44.11"
            transform="rotate(135 50 50)"
            className="animate-arc-draw"
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center">
          <span className="text-[24px] font-bold leading-none tabular-nums text-gl-text">
            7.4
          </span>
          <span className="mt-0.5 text-[10px] text-gl-text-faint">/ 10</span>
        </div>
      </div>

      <p className="text-[11px] text-gl-text-muted">across 147 entries</p>
    </div>
  );
}
