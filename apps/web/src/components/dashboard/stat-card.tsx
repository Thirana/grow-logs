import { cn } from '@/lib/utils';
import { IconTrendUp, IconTrendDown } from '@/components/common/icons';

interface StatCardTrend {
  up: boolean;
  text: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  sub?: string;
  subTone?: 'sage' | 'muted';
  trend?: StatCardTrend;
  className?: string;
}

export function StatCard({
  label,
  value,
  suffix,
  sub,
  subTone = 'muted',
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn('border-gl-border bg-gl-surface shadow-gl rounded-xl border p-5', className)}
    >
      <p className="text-gl-text-faint text-[11px] font-bold tracking-[0.12em] uppercase">
        {label}
      </p>

      <div className="text-gl-text mt-3 mb-1.5 flex items-baseline gap-1 font-sans text-[42px] leading-none font-bold tracking-[-0.03em] tabular-nums">
        {value}
        {suffix && <span className="text-gl-text-muted text-[18px] font-semibold">{suffix}</span>}
      </div>

      {trend && (
        <div className="text-gl-text-muted inline-flex items-center gap-1.5 text-[12px]">
          <span
            className={cn(
              'inline-flex size-4 items-center justify-center rounded',
              trend.up ? 'bg-gl-primary-soft text-gl-primary' : 'bg-gl-danger-soft text-gl-danger',
            )}
          >
            {trend.up ? <IconTrendUp size={11} /> : <IconTrendDown size={11} />}
          </span>
          {trend.text}
        </div>
      )}

      {sub && !trend && (
        <p
          className={cn(
            'text-[12px] leading-snug',
            subTone === 'sage' ? 'text-gl-primary' : 'text-gl-text-muted',
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
