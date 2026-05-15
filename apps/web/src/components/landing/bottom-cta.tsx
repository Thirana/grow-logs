import Link from 'next/link';
import { GlButton } from '@/components/common/gl-button';
import { IconArrow, IconCheck } from '@/components/common/icons';
import { FadeIn } from '@/components/common/fade-in';

const STAT_PILLS = [
  { label: 'entries logged', value: '147', color: 'text-gl-primary' },
  { label: 'day streak', value: '9', color: 'text-gl-warning' },
  { label: 'avg score', value: '7.4', color: 'text-gl-learn' },
] as const;

const TRUST_BADGES = [
  'Free forever for core features',
  'No setup required',
  'Built for developers',
] as const;

export function BottomCta() {
  return (
    <section className="py-12 sm:py-16 lg:pt-16 lg:pb-20">
      <div className="border-gl-border bg-gl-surface relative overflow-hidden rounded-3xl border px-6 py-16 text-center sm:px-10 sm:py-20">
        {/* Sage radial halo — top and bottom for depth */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: `
              radial-gradient(55% 70% at 50% 0%, rgba(111, 200, 160, 0.13) 0%, transparent 70%),
              radial-gradient(40% 50% at 50% 100%, rgba(111, 200, 160, 0.07) 0%, transparent 70%)
            `,
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <FadeIn>
          <div className="relative z-10">
            {/* Stat pills — preview of what you track */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2.5">
              {STAT_PILLS.map(({ label, value, color }) => (
                <span
                  key={label}
                  className="border-gl-border bg-gl-surface-2 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
                >
                  <span className={`font-mono text-[15px] font-bold tabular-nums ${color}`}>
                    {value}
                  </span>
                  <span className="text-gl-text-muted text-[12px]">{label}</span>
                </span>
              ))}
            </div>

            {/* Heading */}
            <h2 className="text-gl-text mx-auto mb-4 max-w-[700px] text-[38px] leading-[1.05] font-bold tracking-[-0.030em] text-balance sm:text-[48px] sm:tracking-[-0.032em] lg:text-[56px] lg:tracking-[-0.035em]">
              Start building a record of your <span className="text-gl-primary">growth</span>.
            </h2>

            {/* Subtext */}
            <p className="text-gl-text-muted mx-auto mb-9 max-w-[520px] text-[17px] leading-[1.55] sm:text-[18px]">
              The best time to start was your first day of learning. The second best time is today.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" tabIndex={-1}>
                <GlButton variant="primary" size="lg" trailing={<IconArrow />}>
                  Start for free
                </GlButton>
              </Link>
              <Link href="#how" tabIndex={-1}>
                <GlButton variant="secondary" size="lg">
                  See how it works
                </GlButton>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="text-gl-text-muted inline-flex items-center gap-2 text-[13px] font-medium"
                >
                  <span className="bg-gl-primary-soft text-gl-primary inline-flex size-[18px] items-center justify-center rounded-full">
                    <IconCheck size={11} />
                  </span>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
