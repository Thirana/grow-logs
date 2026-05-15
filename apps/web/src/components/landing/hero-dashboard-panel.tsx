import { cn } from '@/lib/utils';
import { Logo } from '@/components/common/logo';
import { TypeBadge } from '@/components/common/type-badge';
import { ScorePill } from '@/components/common/score-pill';
import { IconTrendUp } from '@/components/common/icons';

const STREAK_DAYS = 9;

const HERO_STATS = [
  { label: 'Total entries', value: '147', secondary: 'since you started', amber: false },
  { label: 'This week',     value: '12',  secondary: '↑ +3 vs last week',  amber: false },
  { label: 'Avg score',     value: '7.4', secondary: 'out of 10',          amber: false },
  { label: 'Best streak',   value: '23d', secondary: 'Current: 9 days',    amber: true  },
] as const;

const HERO_CATEGORIES = [
  { name: 'Backend',       count: 38, swatchColor: '#6FC8A0', pct: 100 },
  { name: 'System Design', count: 24, swatchColor: '#7C8FE0', pct: 63  },
  { name: 'Reading',       count: 22, swatchColor: '#BFA8E5', pct: 58  },
  { name: 'Side Project',  count: 19, swatchColor: '#E0AE52', pct: 50  },
] as const;

const HERO_ENTRIES = [
  {
    day: '14', month: 'MAY', type: 'Work' as const,
    catName: 'Backend', swatchColor: '#6FC8A0',
    text: 'Refactored auth into a single guard. Test surface dropped by half.',
    score: 8,
  },
  {
    day: '14', month: 'MAY', type: 'Learning' as const,
    catName: 'Reading', swatchColor: '#BFA8E5',
    text: 'Chapter 4: DDIA. Replication patterns; conflict resolution finally clicked.',
    score: 7,
  },
  {
    day: '13', month: 'MAY', type: 'Work' as const,
    catName: 'Side Project', swatchColor: '#E0AE52',
    text: 'Shipped the CSV import flow. Row-level errors inline.',
    score: 9,
  },
] as const;

// Border logic for the 2-col (mobile) → 4-col (desktop) stats strip
const STAT_BORDER_CLASSES = [
  'border-r border-b border-gl-border sm:border-b-0',
  'border-b border-gl-border sm:border-r sm:border-b-0',
  'border-r border-gl-border',
  '',
] as const;

export function HeroDashboardPanel() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gl-border-strong bg-gl-surface text-left shadow-gl-hard">

      {/* Chrome bar */}
      <div className="flex items-center justify-between border-b border-gl-border bg-gl-bg-subtle px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Logo size={16} />
          <span className="text-[13px] font-bold tracking-[-0.01em] text-gl-text">Dashboard</span>
          <span className="ml-1 font-mono text-[11px] text-gl-text-faint">· Thu, 15 May</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gl-warning-soft px-2.5 py-[5px] text-[11.5px] font-bold text-gl-warning">
          <IconTrendUp size={10} />
          {STREAK_DAYS}-day streak
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 border-b border-gl-border sm:grid-cols-4">
        {HERO_STATS.map(({ label, value, secondary, amber }, i) => (
          <div key={label} className={cn('px-4 py-3', STAT_BORDER_CLASSES[i])}>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gl-text-faint">
              {label}
            </div>
            <div
              className={cn(
                'text-[22px] font-bold leading-none tracking-[-0.02em] tabular-nums',
                amber ? 'text-gl-warning' : 'text-gl-text',
              )}
            >
              {value}
            </div>
            <div className="mt-0.5 text-[11px] text-gl-text-muted">{secondary}</div>
          </div>
        ))}
      </div>

      {/* Body: categories | entry rows */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">

        {/* Categories column */}
        <div className="border-b border-gl-border px-5 py-4 md:border-r md:border-b-0">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-gl-text-faint">
            Categories
          </div>
          <div className="flex flex-col gap-2.5">
            {HERO_CATEGORIES.map(({ name, count, swatchColor, pct }) => (
              <div
                key={name}
                className="grid items-center gap-x-2"
                style={{ gridTemplateColumns: '1fr 64px 28px' }}
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: swatchColor }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-[12px] font-medium text-gl-text">{name}</span>
                </div>
                <div className="relative h-[5px] overflow-hidden rounded-full bg-gl-bg-subtle">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${pct}%`, background: swatchColor, opacity: 0.65 }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-right font-mono text-[11px] tabular-nums text-gl-text-faint">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Entry rows */}
        <div className="divide-y divide-gl-border">
          {HERO_ENTRIES.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5">
              {/* Date */}
              <div className="w-8 shrink-0 text-center">
                <div className="text-[15px] font-bold leading-none tracking-[-0.01em] text-gl-text">
                  {entry.day}
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase text-gl-text-faint">
                  {entry.month}
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <TypeBadge type={entry.type} />
                  <span
                    className="flex items-center gap-1 text-[11.5px] font-medium text-gl-text whitespace-nowrap"
                  >
                    <span
                      className="size-[6px] rounded-full"
                      style={{ background: entry.swatchColor }}
                      aria-hidden="true"
                    />
                    {entry.catName}
                  </span>
                </div>
                <p className="truncate text-[12.5px] italic leading-snug text-gl-text-muted">
                  {entry.text}
                </p>
              </div>

              {/* Score */}
              <ScorePill score={entry.score} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
