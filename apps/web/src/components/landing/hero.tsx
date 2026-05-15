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
      <div className="border-gl-border bg-gl-surface text-gl-text-muted mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1 pr-3.5 text-[12px] font-medium">
        <span className="bg-gl-primary-soft text-gl-primary rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-[0.08em] uppercase">
          New
        </span>
        <span className="text-gl-text">
          <span className="sm:hidden">Free to start · no setup required</span>
          <span className="hidden sm:inline">
            Free to start · no setup required · built for developers
          </span>
        </span>
        <IconArrow size={12} className="text-gl-text-muted" />
      </div>

      {/* H1 — three-beat reveal: line 1 → line 2 → "built" stamps in */}
      <h1 className="text-gl-text mx-auto mb-6 max-w-[820px] text-[52px] leading-[1.02] font-bold tracking-[-0.035em] sm:text-[64px] lg:text-[78px]">
        <span className="animate-fade-up-lg inline-block">
          <span className="bg-gradient-to-r from-[#2EB8A0] to-[#7DDFD0] bg-clip-text text-transparent">
            Never forget
          </span>{' '}
          what
        </span>
        <br />
        <span className="animate-fade-up-lg animation-delay-500 inline-block">
          you learned or{' '}
          <span className="text-gl-primary animate-scale-in animation-delay-800">built</span>.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-gl-text-muted mx-auto mb-10 max-w-[620px] text-[17px] leading-[1.55] text-pretty sm:text-[20px]">
        Grow Logs is a daily logging tool for developers and self-learners. Track your work and
        learning, organised by your own categories, so your progress is always visible and never
        lost.
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
            className="text-gl-text-muted inline-flex items-center gap-[7px] text-[13px] font-medium whitespace-nowrap"
          >
            <span className="bg-gl-primary-soft text-gl-primary inline-flex size-[18px] items-center justify-center rounded-full">
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
