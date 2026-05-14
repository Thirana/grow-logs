import { cn } from '@/lib/utils';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        'text-[11px] font-bold tracking-[0.12em] uppercase text-gl-text-muted',
        className,
      )}
    >
      {children}
    </p>
  );
}
