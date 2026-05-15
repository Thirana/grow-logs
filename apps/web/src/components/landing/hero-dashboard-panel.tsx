import { cn } from '@/lib/utils';
import { Logo } from '@/components/common/logo';
import { TypeBadge } from '@/components/common/type-badge';
import { ScorePill } from '@/components/common/score-pill';
import { IconTrendUp } from '@/components/common/icons';

const STREAK_DAYS = 9;

const HERO_STATS = [
  { label: 'Total entries', value: '147', secondary: 'since you started', amber: false },
  { label: 'This week', value: '12', secondary: '↑ +3 vs last week', amber: false },
  { label: 'Avg score', value: '7.4', secondary: 'out of 10', amber: false },
  { label: 'Best streak', value: '23d', secondary: 'Current: 9 days', amber: true },
] as const;

const HERO_CATEGORIES = [
  { name: 'Backend', count: 38, swatchColor: '#6FC8A0', pct: 100 },
  { name: 'System Design', count: 24, swatchColor: '#7C8FE0', pct: 63 },
  { name: 'Reading', count: 22, swatchColor: '#BFA8E5', pct: 58 },
  { name: 'Side Project', count: 19, swatchColor: '#E0AE52', pct: 50 },
] as const;

const HERO_ENTRIES = [
  {
    day: '14',
    month: 'MAY',
    type: 'Work' as const,
    catName: 'Backend',
    swatchColor: '#6FC8A0',
    text: 'Refactored auth into a single guard. Test surface dropped by half.',
    score: 8,
  },
  {
    day: '14',
    month: 'MAY',
    type: 'Learning' as const,
    catName: 'Reading',
    swatchColor: '#BFA8E5',
    text: 'Chapter 4: DDIA. Replication patterns; conflict resolution finally clicked.',
    score: 7,
  },
  {
    day: '13',
    month: 'MAY',
    type: 'Work' as const,
    catName: 'Side Project',
    swatchColor: '#E0AE52',
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
    <div className="border-gl-border-strong bg-gl-surface shadow-gl-hard overflow-hidden rounded-2xl border text-left">
      {/* Chrome bar */}
      <div className="border-gl-border bg-gl-bg-subtle flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Logo size={16} />
          <span className="text-gl-text text-[13px] font-bold tracking-[-0.01em]">Dashboard</span>
          <span className="text-gl-text-faint ml-1 font-mono text-[11px]">· Thu, 15 May</span>
        </div>
        <div className="bg-gl-warning-soft text-gl-warning inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[11.5px] font-bold">
          <IconTrendUp size={10} />
          {STREAK_DAYS}-day streak
        </div>
      </div>

      {/* Stats strip */}
      <div className="border-gl-border grid grid-cols-2 border-b sm:grid-cols-4">
        {HERO_STATS.map(({ label, value, secondary, amber }, i) => (
          <div key={label} className={cn('px-4 py-3', STAT_BORDER_CLASSES[i])}>
            <div className="text-gl-text-faint mb-1 text-[10px] font-bold tracking-[0.1em] uppercase">
              {label}
            </div>
            <div
              className={cn(
                'text-[22px] leading-none font-bold tracking-[-0.02em] tabular-nums',
                amber ? 'text-gl-warning' : 'text-gl-text',
              )}
            >
              {value}
            </div>
            <div className="text-gl-text-muted mt-0.5 text-[11px]">{secondary}</div>
          </div>
        ))}
      </div>

      {/* Body: categories | entry rows */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
        {/* Categories column */}
        <div className="border-gl-border border-b px-5 py-4 md:border-r md:border-b-0">
          <div className="text-gl-text-faint mb-3 text-[10px] font-bold tracking-[0.1em] uppercase">
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
                  <span className="text-gl-text truncate text-[12px] font-medium">{name}</span>
                </div>
                <div className="bg-gl-bg-subtle relative h-[5px] overflow-hidden rounded-full">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${pct}%`, background: swatchColor, opacity: 0.65 }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-gl-text-faint text-right font-mono text-[11px] tabular-nums">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Entry rows */}
        <div className="divide-gl-border divide-y">
          {HERO_ENTRIES.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5">
              {/* Date */}
              <div className="w-8 shrink-0 text-center">
                <div className="text-gl-text text-[15px] leading-none font-bold tracking-[-0.01em]">
                  {entry.day}
                </div>
                <div className="text-gl-text-faint mt-0.5 font-mono text-[9px] uppercase">
                  {entry.month}
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <TypeBadge type={entry.type} />
                  <span className="text-gl-text flex items-center gap-1 text-[11.5px] font-medium whitespace-nowrap">
                    <span
                      className="size-[6px] rounded-full"
                      style={{ background: entry.swatchColor }}
                      aria-hidden="true"
                    />
                    {entry.catName}
                  </span>
                </div>
                <p className="text-gl-text-muted truncate text-[12.5px] leading-snug italic">
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
