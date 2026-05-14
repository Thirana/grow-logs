import Link from 'next/link';
import { Eyebrow } from '@/components/common/eyebrow';
import { GlButton } from '@/components/common/gl-button';
import { IconArrow, IconArrowRight } from '@/components/common/icons';
import { Logo } from '@/components/common/logo';
import { StatsRow } from '@/components/dashboard/stats-row';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { ActivityCard } from '@/components/dashboard/activity-card';
import { RecentEntries } from '@/components/dashboard/recent-entries';
import {
  MOCK_STATS,
  MOCK_CATEGORIES,
  MOCK_DAILY,
  MOCK_ENTRIES,
} from '@/data/dashboard-mock';

export function LivePreview() {
  return (
    <section id="preview" className="py-16 sm:py-20 lg:py-24">
      {/* Section header */}
      <div className="mx-auto mb-14 max-w-[680px] text-center">
        <Eyebrow className="mb-3.5">Live preview</Eyebrow>
        <h2 className="mb-3.5 text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-gl-text text-balance sm:text-[44px] sm:tracking-[-0.028em]">
          See it in <span className="text-gl-primary">action</span>.
        </h2>
        <p className="text-[17px] leading-[1.55] text-gl-text-muted text-pretty">
          The real dashboard, embedded right here. Switch the chart tabs, filter the entries — it all works.
        </p>
      </div>

      {/* Preview window */}
      <div className="relative overflow-hidden rounded-[18px] border border-gl-border bg-gl-bg-subtle shadow-gl-lg">
        {/* Chrome bar */}
        <div className="flex items-center justify-between border-b border-gl-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Logo size={16} />
            <span className="text-[13px] font-bold leading-none tracking-[-0.01em] text-gl-text">
              Dashboard
            </span>
            <span className="ml-1.5 font-mono text-[11px] text-gl-text-faint">live · click around</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-gl-primary hover:text-gl-primary-hover whitespace-nowrap"
          >
            Open full dashboard <IconArrowRight size={12} />
          </Link>
        </div>

        {/* Dashboard content */}
        <div className="px-6 py-5 sm:px-8">
          <StatsRow stats={MOCK_STATS} />
          <ActivityCard daily={MOCK_DAILY} categories={MOCK_CATEGORIES} />
          <RecentEntries entries={MOCK_ENTRIES} />
        </div>

        {/* Bottom fade — creates the "peek" effect */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{
            background: 'linear-gradient(to top, var(--gl-bg-subtle) 20%, transparent)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link href="/dashboard" tabIndex={-1}>
          <GlButton variant="primary" size="lg" trailing={<IconArrow />}>
            Try the full dashboard
          </GlButton>
        </Link>
      </div>
    </section>
  );
}
