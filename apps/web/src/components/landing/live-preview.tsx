import Link from 'next/link';
import { GlButton } from '@/components/common/gl-button';
import { IconArrow, IconArrowRight } from '@/components/common/icons';
import { Logo } from '@/components/common/logo';
import { StatsRow } from '@/components/dashboard/stats-row';
import { ActivityCard } from '@/components/dashboard/activity-card';
import { RecentEntries } from '@/components/dashboard/recent-entries';
import { FadeIn } from '@/components/common/fade-in';
import type { CategorySummaryItem, Entry } from '@grow-logs/types';

// Static preview data — landing page only, never fetched.
const _workSeed = [
  1, 2, 0, 3, 1, 2, 3, 1, 2, 2, 4, 2, 3, 1, 0, 2, 3, 2, 4, 1, 3, 2, 3, 1, 2, 4, 3, 2, 1, 3,
];
const PREVIEW_DAILY = _workSeed.map((w, i) => ({
  date: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
  workCount: w,
  learnCount: ((i * 3) % 4) + (i % 5 === 0 ? 1 : 0),
}));

const PREVIEW_BY_CATEGORY: CategorySummaryItem[] = [
  {
    category: { id: '1', name: 'Backend', color: '#69B598', isCompleted: false },
    entryCount: 38,
    averageProductivityScore: 7.8,
    byType: { WORK: 28, LEARNING: 10 },
  },
  {
    category: { id: '2', name: 'System Design', color: '#8285BA', isCompleted: false },
    entryCount: 24,
    averageProductivityScore: 7.2,
    byType: { WORK: 12, LEARNING: 12 },
  },
  {
    category: { id: '3', name: 'Reading', color: '#B87DA2', isCompleted: false },
    entryCount: 22,
    averageProductivityScore: 7.5,
    byType: { WORK: 0, LEARNING: 22 },
  },
  {
    category: { id: '4', name: 'Side Project', color: '#C4A05E', isCompleted: false },
    entryCount: 19,
    averageProductivityScore: 8.4,
    byType: { WORK: 19, LEARNING: 0 },
  },
  {
    category: { id: '5', name: 'Soft Skills', color: '#B87060', isCompleted: false },
    entryCount: 12,
    averageProductivityScore: 6.9,
    byType: { WORK: 6, LEARNING: 6 },
  },
];

const PREVIEW_ENTRIES: Entry[] = [
  {
    id: '1',
    type: 'WORK',
    text: 'Refactored auth into a single guard. Pulled the refresh-token rotation out of the login handler and the test surface dropped by half.',
    score: 8,
    entryDate: '2025-05-14',
    categoryId: '1',
    categoryName: 'Backend',
    subcategoryId: 'a',
    subcategoryName: 'NestJS',
    createdAt: '2025-05-14T10:00:00Z',
  },
  {
    id: '2',
    type: 'LEARNING',
    text: 'Chapter 4: Designing Data-Intensive Applications. Replication patterns; conflict resolution figure finally clicked.',
    score: 7,
    entryDate: '2025-05-14',
    categoryId: '3',
    categoryName: 'Reading',
    subcategoryId: 'b',
    subcategoryName: 'DDIA',
    createdAt: '2025-05-14T14:00:00Z',
  },
  {
    id: '3',
    type: 'WORK',
    text: 'Shipped the import-from-CSV flow. Row-level errors inline. Cut onboarding friction for the three people who tried it.',
    score: 9,
    entryDate: '2025-05-13',
    categoryId: '4',
    categoryName: 'Side Project',
    subcategoryId: 'c',
    subcategoryName: 'Grow Logs',
    createdAt: '2025-05-13T11:00:00Z',
  },
  {
    id: '4',
    type: 'LEARNING',
    text: 'Read up on cache stampedes: request coalescing, lock-and-refresh, probabilistic early expiration. Trade-offs make sense now.',
    score: 6,
    entryDate: '2025-05-13',
    categoryId: '2',
    categoryName: 'System Design',
    subcategoryId: 'd',
    subcategoryName: 'Caching',
    createdAt: '2025-05-13T16:00:00Z',
  },
  {
    id: '5',
    type: 'WORK',
    text: 'Replaced two redundant indexes after running the unused-index report. Saved ~140 MB. Tiny but satisfying.',
    score: 7,
    entryDate: '2025-05-12',
    categoryId: '1',
    categoryName: 'Backend',
    subcategoryId: 'e',
    subcategoryName: 'Postgres',
    createdAt: '2025-05-12T09:00:00Z',
  },
];

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
            <StatsRow
              totalEntries={147}
              thisWeekCount={12}
              lastWeekCount={9}
              workPct={62}
              learnPct={38}
              avgProductivity={7.4}
              currentStreak={9}
              longestStreak={23}
              period="30d"
            />
            <ActivityCard dailyActivity={PREVIEW_DAILY} byCategory={PREVIEW_BY_CATEGORY} />
            <RecentEntries entries={PREVIEW_ENTRIES} />
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
