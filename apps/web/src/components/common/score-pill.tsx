import { cn } from '@/lib/utils';

interface ScorePillProps {
  score: number;
  className?: string;
}

export function ScorePill({ score, className }: ScorePillProps) {
  const colorClass =
    score >= 8
      ? 'bg-gl-primary-soft text-gl-primary'
      : score >= 5
        ? 'bg-gl-warning-soft text-gl-warning'
        : 'bg-gl-danger-soft text-gl-danger';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[12px] font-semibold whitespace-nowrap tabular-nums leading-none',
        colorClass,
        className,
      )}
    >
      <span className="text-current/60 font-normal">score</span>
      {score} / 10
    </span>
  );
}
