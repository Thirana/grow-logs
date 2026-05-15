import { StatCard } from './stat-card';
import { SplitStatCard } from './split-stat-card';
import type { DashboardStats } from '@/data/dashboard-mock';

interface StatsRowProps {
  stats: DashboardStats;
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
      <StatCard label="Total entries" value={stats.totalEntries} sub="since you started" />
      <StatCard
        label="This week"
        value={stats.thisWeek}
        trend={{ up: stats.weekTrendUp, text: stats.weekTrendText }}
      />
      <SplitStatCard
        workPct={stats.workPct}
        learnPct={stats.learnPct}
        className="col-span-2 lg:col-span-1"
      />
      <StatCard
        label="Avg productivity"
        value={stats.avgProductivity.toFixed(1)}
        suffix="/10"
        sub="across scored entries"
      />
      <StatCard
        label="Current streak"
        value={stats.currentStreak}
        sub={`Personal best: ${stats.personalBestStreak} days`}
        subTone="sage"
      />
    </div>
  );
}
