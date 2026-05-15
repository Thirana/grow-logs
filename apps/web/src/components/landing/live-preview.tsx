import Link from 'next/link';
import { GlButton } from '@/components/common/gl-button';
import { IconArrow, IconArrowRight } from '@/components/common/icons';
import { Logo } from '@/components/common/logo';
import { StatsRow } from '@/components/dashboard/stats-row';
import { ActivityCard } from '@/components/dashboard/activity-card';
import { RecentEntries } from '@/components/dashboard/recent-entries';
import { FadeIn } from '@/components/common/fade-in';
import { MOCK_STATS, MOCK_CATEGORIES, MOCK_DAILY, MOCK_ENTRIES } from '@/data/dashboard-mock';

export function LivePreview() {
  return (
    <section id="preview" className="py-12 sm:py-16 lg:py-20">
      {/* Section header */}
      <FadeIn>
        <div className="mx-auto mb-10 max-w-[680px] text-center">
          <h2 className="text-gl-text mb-3.5 text-[34px] leading-[1.08] font-bold tracking-[-0.025em] text-balance sm:text-[44px] sm:tracking-[-0.028em]">
            See it in <span className="text-gl-primary">action</span>.
          </h2>
          <p className="text-gl-text-muted text-[17px] leading-[1.55] text-pretty">
            The real dashboard, embedded right here. Switch the chart tabs, filter the entries. It
            all works.
          </p>
        </div>
      </FadeIn>

      {/* Preview window */}
      <FadeIn delay={130}>
        <div className="border-gl-border bg-gl-bg-subtle shadow-gl-lg relative overflow-hidden rounded-[18px] border">
          {/* Chrome bar */}
          <div className="border-gl-border flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Logo size={16} />
              <span className="text-gl-text text-[13px] leading-none font-bold tracking-[-0.01em]">
                Dashboard
              </span>
              <span className="ml-1.5 inline-flex items-center gap-1.5">
                <span className="relative inline-flex size-1.5">
                  <span className="bg-gl-primary absolute inline-flex size-full animate-ping rounded-full opacity-60" />
                  <span className="bg-gl-primary relative inline-flex size-1.5 rounded-full" />
                </span>
                <span className="text-gl-primary font-mono text-[11px] font-semibold">live</span>
                <span className="text-gl-text-faint font-mono text-[11px]">· click around</span>
              </span>
            </div>
            <Link
              href="/dashboard"
              className="text-gl-primary hover:text-gl-primary-hover hidden items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap sm:inline-flex"
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
      </FadeIn>
    </section>
  );
}
