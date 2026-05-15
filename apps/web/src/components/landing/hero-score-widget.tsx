'use client';

import { useFadeCycle } from '@/hooks/use-hero-cycle';

interface HeroScoreWidgetProps {
  className?: string;
}

// Arc math: r=36, 270° arc on a 100×100 viewBox
// Full circumference = 2π×36 = 226.19
// 270° arc length  = 226.19 × (270/360) = 169.65  (stroke-dasharray for track + fill)
// rotate(135 50 50) positions the 90° gap at the bottom
// dashOffset for a given score = 169.65 × (1 − score/10)
const ARC_LENGTH = 169.65;
const computeDashOffset = (score: number) => ARC_LENGTH * (1 - score / 10);

const SCORES = [7.4, 8.1, 6.9, 9.2] as const;

export function HeroScoreWidget({ className = '' }: HeroScoreWidgetProps) {
  // Cycle the displayed score number with a fade; the arc transitions via CSS.
  const { current: score, visible } = useFadeCycle(SCORES, 6000, 480);
  const dashOffset = computeDashOffset(score);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-gl-border bg-gl-surface p-5 text-center shadow-gl transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
        Avg productivity
      </p>

      <div className="relative inline-flex items-center justify-center">
        <svg width="108" height="108" viewBox="0 0 100 100" aria-hidden="true">
          {/* Background track — full 270° arc */}
          <circle
            cx="50" cy="50" r="36"
            fill="none"
            stroke="var(--gl-bg-subtle)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH} 226.19`}
            transform="rotate(135 50 50)"
          />
          {/* Filled arc — transitions smoothly when dashOffset changes */}
          <circle
            cx="50" cy="50" r="36"
            fill="none"
            stroke="var(--gl-primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={dashOffset}
            transform="rotate(135 50 50)"
            style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>

        {/* Center label — fades with the score cycle */}
        <div
          className="absolute flex flex-col items-center transition-opacity duration-[480ms]"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <span className="text-[24px] font-bold leading-none tabular-nums text-gl-text">
            {score.toFixed(1)}
          </span>
          <span className="mt-0.5 text-[10px] text-gl-text-faint">/ 10</span>
        </div>
      </div>

      <p className="text-[11px] text-gl-text-muted">across 147 entries</p>
    </div>
  );
}
