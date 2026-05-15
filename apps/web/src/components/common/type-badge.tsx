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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold tracking-[0.01em] whitespace-nowrap',
        isWork ? 'bg-gl-work-bg text-gl-work' : 'bg-gl-learn-bg text-gl-learn',
        className,
      )}
    >
      <span className="size-[5px] rounded-full bg-current" aria-hidden="true" />
      {isWork ? 'Work' : 'Learning'}
    </span>
  );
}
