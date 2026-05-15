'use client';

import { useFadeCycle } from '@/hooks/use-hero-cycle';

interface HeroStreakWidgetProps {
  className?: string;
}

const STREAKS = [7, 9, 12, 15] as const;

export function HeroStreakWidget({ className = '' }: HeroStreakWidgetProps) {
  const { current: streak, visible } = useFadeCycle(STREAKS, 5500, 500);

  return (
    <div
      className={`border-gl-border bg-gl-surface shadow-gl hover:shadow-gl-lg flex flex-col items-center justify-center gap-1.5 rounded-xl border p-5 text-center transition-all duration-[150ms] hover:-translate-y-0.5 ${className}`}
    >
      <p className="text-gl-text-faint text-[10px] font-bold tracking-[0.12em] uppercase">
        Current streak
      </p>

      <span
        className="text-gl-warning my-1 text-[52px] leading-none font-bold tabular-nums transition-opacity duration-[500ms]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {streak}
      </span>

      <p className="text-gl-warning text-[13px] font-semibold">day streak</p>
      <p className="text-gl-text-faint text-[10.5px]">Personal best: 23d</p>
    </div>
  );
}
