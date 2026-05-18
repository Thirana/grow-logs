import { type JSX } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export const metadata = {
  title: 'Dashboard',
};

export default function DashboardPage(): JSX.Element {
  return (
    <div className="bg-gl-bg text-gl-text flex min-h-screen">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        <DashboardClient />
      </main>
    </div>
  );
}
