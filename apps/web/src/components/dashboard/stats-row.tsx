import { type JSX } from 'react';
import { StatCard } from './stat-card';
import { SplitStatCard } from './split-stat-card';

interface StatsRowProps {
  totalEntries: number;
  thisWeekCount: number;
  lastWeekCount: number;
  workPct: number;
  learnPct: number;
  avgProductivity: number | null;
  currentStreak: number;
  longestStreak: number;
  period: '7d' | '30d' | 'all';
}

export function StatsRow({
  totalEntries,
  thisWeekCount,
  lastWeekCount,
  workPct,
  learnPct,
  avgProductivity,
  currentStreak,
  longestStreak,
  period,
}: StatsRowProps): JSX.Element {
  const weekDiff = thisWeekCount - lastWeekCount;
  const weekTrendUp = weekDiff >= 0;
  const weekTrendText =
    weekDiff === 0
      ? 'Same as last week'
      : `${Math.abs(weekDiff)} ${weekDiff > 0 ? 'more' : 'fewer'} than last week`;

  const splitLabel =
    period === '7d'
      ? "This week's split"
      : period === '30d'
        ? "This month's split"
        : 'All-time split';

  const totalSub =
    period === '7d' ? 'past 7 days' : period === '30d' ? 'past 30 days' : 'since you started';

  return (
    <div className="mb-4 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
      <StatCard label="Total entries" value={totalEntries} sub={totalSub} />
      <StatCard
        label="This week"
        value={thisWeekCount}
        trend={{ up: weekTrendUp, text: weekTrendText }}
      />
      <SplitStatCard
        workPct={workPct}
        learnPct={learnPct}
        label={splitLabel}
        className="col-span-2 lg:col-span-1"
      />
      <StatCard
        label="Avg productivity"
        value={avgProductivity != null ? avgProductivity.toFixed(1) : '—'}
        suffix={avgProductivity != null ? '/10' : undefined}
        sub="across scored entries"
      />
      <StatCard
        label="Current streak"
        value={currentStreak}
        sub={`Personal best: ${longestStreak} days`}
        subTone="sage"
      />
    </div>
  );
}
