interface HeroStreakWidgetProps {
  className?: string;
}

export function HeroStreakWidget({ className = '' }: HeroStreakWidgetProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gl-border bg-gl-surface p-5 text-center shadow-gl transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
        Current streak
      </p>

      {/* Streak number */}
      <span className="my-1 text-[52px] font-bold leading-none tabular-nums text-gl-warning animate-scale-in">
        9
      </span>

      <p className="text-[13px] font-semibold text-gl-warning">day streak</p>
      <p className="text-[10.5px] text-gl-text-faint">Personal best: 23d</p>
    </div>
  );
}
