import Link from 'next/link';
import { GlButton } from '@/components/common/gl-button';
import { IconArrow, IconCheck } from '@/components/common/icons';
import { HeroEntryCard } from './hero-entry-card';
import { HeroStreakWidget } from './hero-streak-widget';
import { HeroScoreWidget } from './hero-score-widget';
import { HeroSplitWidget } from './hero-split-widget';
import { HeroCategoriesWidget } from './hero-categories-widget';

const TRUST_BADGES = ['Free to start', 'No setup required', 'Built for developers'] as const;

export function Hero() {
  return (
    <section className="relative pt-16 pb-20 text-center sm:pt-20 sm:pb-24">
      {/* Announcement badge */}
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gl-border bg-gl-surface px-3 py-1 pr-3.5 text-[12px] font-medium text-gl-text-muted">
        <span className="rounded-full bg-gl-primary-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-gl-primary">
          New
        </span>
        <span className="text-gl-text">
          Free to start · no setup required · built for developers
        </span>
        <IconArrow size={12} className="text-gl-text-muted" />
      </div>

      {/* H1 */}
      <h1 className="mx-auto mb-6 max-w-[820px] text-[52px] font-bold leading-[1.02] tracking-[-0.035em] text-gl-text text-balance sm:text-[64px] lg:text-[78px]">
        Never forget what
        <br />
        you learned or{' '}
        <span className="text-gl-primary">built</span>.
      </h1>

      {/* Subtitle */}
      <p className="mx-auto mb-10 max-w-[620px] text-[17px] leading-[1.55] text-gl-text-muted text-pretty sm:text-[20px]">
        Grow Logs is a daily logging tool for developers and self-learners. Track your work
        and learning, organised by your own categories — so your progress is always visible
        and never lost.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/register" tabIndex={-1}>
          <GlButton variant="primary" size="lg" trailing={<IconArrow />}>
            Start for free
          </GlButton>
        </Link>
        <Link href="#preview" tabIndex={-1}>
          <GlButton variant="secondary" size="lg">
            See how it works
          </GlButton>
        </Link>
      </div>

      {/* Trust badges */}
      <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge}
            className="inline-flex items-center gap-[7px] text-[13px] font-medium text-gl-text-muted whitespace-nowrap"
          >
            <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-gl-primary-soft text-gl-primary">
              <IconCheck size={11} />
            </span>
            {badge}
          </div>
        ))}
      </div>

      {/* Product spot — bento grid */}
      <div className="relative mt-20">
        <div className="mx-auto max-w-[960px] text-left">
          {/*
            Layout (lg):  [Entry card · row-span-3] | [Streak] [Score]
                                                     | [Split ·  col-span-2  ]
                                                     | [Categories · col-span-2]
            sm: 2-col stack — entry card full width, rest 2-up then full.
          */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            {/* Tall anchor — spans all 3 rows on lg */}
            <div className="sm:col-span-2 lg:col-span-1 lg:row-span-3">
              <HeroEntryCard />
            </div>

            <HeroStreakWidget />
            <HeroScoreWidget />

            <HeroSplitWidget className="sm:col-span-2 lg:col-span-2" />
            <HeroCategoriesWidget className="sm:col-span-2 lg:col-span-2" />
          </div>
        </div>
      </div>
    </section>
  );
}
