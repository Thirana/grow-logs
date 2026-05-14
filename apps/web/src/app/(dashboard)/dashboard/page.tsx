import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import {
  MOCK_STATS,
  MOCK_ENTRIES,
  MOCK_CATEGORIES,
  MOCK_DAILY,
  MOCK_TREND,
} from '@/data/dashboard-mock';

export const metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-gl-bg text-gl-text">
      {/* Sidebar — hidden on mobile, visible on large screens */}
      <div className="hidden lg:block">
        <Sidebar categories={MOCK_CATEGORIES} />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <DashboardClient
          stats={MOCK_STATS}
          entries={MOCK_ENTRIES}
          categories={MOCK_CATEGORIES}
          daily={MOCK_DAILY}
          trend={MOCK_TREND}
        />
      </main>
    </div>
  );
}
