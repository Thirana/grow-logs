import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 22, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <rect x="2"  y="11" width="2.6" height="9"  rx="0.6" className="fill-gl-text" />
      <rect x="6"  y="7"  width="2.6" height="13" rx="0.6" className="fill-gl-text" />
      <rect x="10" y="3"  width="2.6" height="17" rx="0.6" className="fill-gl-primary" />
      <rect x="14" y="9"  width="2.6" height="11" rx="0.6" className="fill-gl-text" />
      <rect x="18" y="13" width="2.6" height="7"  rx="0.6" className="fill-gl-text" />
    </svg>
  );
}
