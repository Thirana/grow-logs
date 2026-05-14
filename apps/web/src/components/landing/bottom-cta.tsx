import Link from 'next/link';
import { GlButton } from '@/components/common/gl-button';
import { IconArrow } from '@/components/common/icons';

// Bar heights for the decorative bar-stack echoes
const BARS_RIGHT = [40, 64, 28, 80, 52, 44, 96, 36] as const;
const BARS_LEFT  = [32, 48, 20, 64] as const;

export function BottomCta() {
  return (
    <section className="py-16 sm:py-20 lg:pt-20 lg:pb-24">
      <div className="relative overflow-hidden rounded-3xl border border-gl-border bg-gl-surface px-6 py-20 text-center sm:px-10">

        {/* Sage radial halo */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: `radial-gradient(50% 80% at 50% 0%, rgba(111, 200, 160, 0.10) 0%, transparent 70%)`,
          }}
          aria-hidden="true"
        />

        {/* Bar-stack echo — right bottom */}
        <div
          className="pointer-events-none absolute right-8 bottom-0 z-0 hidden items-end gap-1.5 opacity-[0.22] sm:flex"
          aria-hidden="true"
        >
          {BARS_RIGHT.map((h, i) => (
            <div
              key={i}
              className="w-3.5 rounded-sm"
              style={{
                height: h,
                background: i === 3 ? 'var(--gl-primary)' : 'var(--gl-text)',
              }}
            />
          ))}
        </div>

        {/* Bar-stack echo — left top (mirrored) */}
        <div
          className="pointer-events-none absolute left-8 top-0 z-0 hidden items-start gap-1.5 opacity-[0.14] sm:flex"
          style={{ transform: 'scaleY(-1)' }}
          aria-hidden="true"
        >
          {BARS_LEFT.map((h, i) => (
            <div
              key={i}
              className="w-3.5 rounded-sm"
              style={{ height: h, background: 'var(--gl-text)' }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h2 className="mx-auto mb-4 max-w-[760px] text-[38px] font-bold leading-[1.05] tracking-[-0.030em] text-gl-text text-balance sm:text-[48px] sm:tracking-[-0.032em] lg:text-[56px] lg:tracking-[-0.035em]">
            Start building a record of your{' '}
            <span className="text-gl-primary">growth</span>.
          </h2>

          <p className="mx-auto mb-9 max-w-[560px] text-[17px] leading-[1.55] text-gl-text-muted sm:text-[18px]">
            The best time to start was your first day of learning. The second best time is
            today.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link href="/register" tabIndex={-1}>
              <GlButton variant="primary" size="lg" trailing={<IconArrow />}>
                Start for free
              </GlButton>
            </Link>
            <span className="text-[12.5px] text-gl-text-faint">No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  );
}
