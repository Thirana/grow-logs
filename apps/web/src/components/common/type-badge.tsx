import { cn } from '@/lib/utils';

type EntryType = 'WORK' | 'LEARNING' | 'Work' | 'Learning';

interface TypeBadgeProps {
  type: EntryType;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const isWork = type === 'WORK' || type === 'Work';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold tracking-[0.01em] whitespace-nowrap',
        isWork ? 'bg-gl-work text-gl-work-ink' : 'bg-gl-learn text-gl-learn-ink',
        className,
      )}
    >
      {isWork ? 'Work' : 'Learning'}
    </span>
  );
}
