// Two-column auth shell shared by all auth pages (register, login, verify-email, check-email).
// Left brand panel is hidden on mobile; right form column is always visible.
import { type JSX } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { IconCheck, IconTrendUp } from '@/components/common/icons';

const FEATURES = [
  'Daily entries with categories and productivity scores',
  'Trends and insights across your work and learning',
  'Your own custom categories — built around how you think',
] as const;

// Static mini entry card — shows a product preview on the brand panel.
function EntryPreview(): JSX.Element {
  return (
    <div className="border-gl-border bg-gl-surface shadow-gl rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-gl-text-faint font-mono text-[10px] font-semibold tracking-[0.12em] uppercase">
          16 May · Today
        </span>
        <span className="bg-gl-primary-soft text-gl-primary rounded-lg px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums">
          <span className="text-gl-primary/60 font-normal">score</span> 9 / 10
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="bg-gl-work-bg text-gl-work rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold">
          Work
        </span>
        <span className="border-gl-border bg-gl-surface-2 text-gl-text-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium">
          <span className="bg-gl-swatch-1 size-[5px] shrink-0 rounded-full" aria-hidden="true" />
          Backend / NestJS
        </span>
      </div>

      <p className="text-gl-text mb-2 text-[14px] leading-snug font-semibold">
        Refactored auth into a single guard.
      </p>
      <p className="text-gl-text-muted text-[12px] leading-relaxed italic">
        Pulled the refresh-token rotation out of the login handler. Tests dropped by half once
        responsibilities were separated.
        <span
          className="bg-gl-primary animate-cursor-blink ml-0.5 inline-block h-[11px] w-px translate-y-px"
          aria-hidden="true"
        />
      </p>

      <div className="border-gl-border mt-3.5 flex items-center justify-between border-t pt-3">
        <span className="text-gl-primary inline-flex items-center gap-1.5 text-[10.5px] font-medium">
          <span className="bg-gl-primary-soft inline-flex size-[13px] items-center justify-center rounded-full">
            <IconCheck size={8} />
          </span>
          Saved · just now
        </span>
        <kbd className="text-gl-text-faint font-mono text-[10px] font-medium">↵ enter</kbd>
      </div>
    </div>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return (
    <div className="flex min-h-screen">
      {/* ── Brand panel — hidden on mobile ─────────────────────────────────────── */}
      <div className="bg-gl-bg-subtle relative hidden flex-col overflow-hidden px-10 py-10 lg:flex lg:w-[440px] xl:w-[500px]">
        {/* Ambient teal glow */}
        <div
          className="pointer-events-none absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(46,184,160,0.09) 0%, transparent 65%)',
          }}
          aria-hidden="true"
        />

        <Link href="/" className="relative z-10 flex w-fit items-center gap-2.5">
          <Logo size={22} />
          <span className="text-gl-text text-[15px] font-bold tracking-tight">Grow Logs</span>
        </Link>

        <div className="relative z-10 flex flex-1 flex-col justify-center gap-8">
          <div>
            <p className="text-[28px] leading-[1.2] font-bold tracking-[-0.02em] xl:text-[32px]">
              <span className="bg-gradient-to-r from-[#2EB8A0] to-[#7DDFD0] bg-clip-text text-transparent">
                Log daily.
              </span>
              <br />
              <span className="text-gl-text">Grow steadily.</span>
            </p>
            <p className="text-gl-text-muted mt-3 text-[13.5px] leading-relaxed">
              A focused space to track your work and learning — organised by your own categories.
            </p>
          </div>

          <EntryPreview />

          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <span className="bg-gl-primary-soft text-gl-primary mt-px inline-flex size-[18px] shrink-0 items-center justify-center rounded-full">
                  <IconCheck size={10} />
                </span>
                <span className="text-gl-text-muted text-[13px] leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-gl-text-faint relative z-10 mt-8 text-[11px]">
          © {new Date().getFullYear()} Grow Logs. All rights reserved.
        </p>
      </div>

      {/* ── Form column ────────────────────────────────────────────────────────── */}
      <div className="bg-gl-bg relative flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        {/* Subtle radial glow behind the form */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(46,184,160,0.04), transparent)',
          }}
          aria-hidden="true"
        />

        {/* Floating product UI fragments — desktop only, provides visual depth */}
        <div
          className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
          style={{ opacity: 0.3 }}
          aria-hidden="true"
        >
          {/* ── Mini streak card — top left ─────────────────────────────── */}
          <div className="absolute top-[6%] left-[4%] -rotate-2">
            <div className="border-gl-border bg-gl-surface shadow-gl w-[160px] rounded-xl border p-4">
              <p className="text-gl-text-faint text-[9px] font-bold tracking-[0.13em] uppercase">
                Current streak
              </p>
              <p className="text-gl-warning mt-1 text-[36px] leading-none font-bold tabular-nums">
                12
              </p>
              <p className="text-gl-warning mt-0.5 text-[11px] font-semibold">day streak</p>
              <p className="text-gl-text-faint mt-0.5 text-[10px]">Personal best: 23d</p>
            </div>
          </div>

          {/* Work badge + date — top middle-left */}
          <div className="absolute top-[32%] left-[5%] rotate-1">
            <span className="bg-gl-work-bg text-gl-work rounded-full px-2.5 py-1 text-[11px] font-semibold">
              Work
            </span>
          </div>
          <div className="absolute top-[40%] left-[4%] -rotate-1">
            <span className="text-gl-text-faint font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
              16 MAY · Today
            </span>
          </div>

          {/* Score pill + category chip — top right */}
          <div className="absolute top-[10%] right-[5%] rotate-2">
            <span className="bg-gl-primary-soft text-gl-primary rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold">
              9 / 10
            </span>
          </div>
          <div className="absolute top-[22%] right-[4%] rotate-3">
            <span className="border-gl-border bg-gl-surface-2 text-gl-text-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium">
              <span className="bg-gl-swatch-1 size-[5px] shrink-0 rounded-full" />
              Backend / NestJS
            </span>
          </div>

          {/* ── Mini work/learning split card — bottom left ──────────────── */}
          <div className="absolute bottom-[6%] left-[4%] rotate-1">
            <div className="border-gl-border bg-gl-surface shadow-gl w-[186px] rounded-xl border p-4">
              <p className="text-gl-text-muted text-[9px] font-bold tracking-[0.12em] uppercase">
                This month&apos;s split
              </p>
              <div className="mt-2.5 mb-2 flex items-baseline justify-between">
                <div>
                  <span className="text-gl-work font-mono text-[20px] font-bold tabular-nums">
                    58%
                  </span>
                  <p className="text-gl-text-muted mt-0.5 text-[10px] font-medium">Work</p>
                </div>
                <div className="text-right">
                  <span className="text-gl-primary font-mono text-[20px] font-bold tabular-nums">
                    42%
                  </span>
                  <p className="text-gl-text-muted mt-0.5 text-[10px] font-medium">Learning</p>
                </div>
              </div>
              <div className="bg-gl-bg-subtle flex h-2 overflow-hidden rounded-full">
                <div
                  className="h-full opacity-85"
                  style={{ width: '58%', background: 'var(--gl-work-fg)' }}
                />
                <div
                  className="h-full opacity-95"
                  style={{ width: '42%', background: 'var(--gl-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Learning badge — bottom middle-left */}
          <div className="absolute bottom-[34%] left-[5%] -rotate-2">
            <span className="bg-gl-learn-bg text-gl-learn rounded-full px-2.5 py-1 text-[11px] font-semibold">
              Learning
            </span>
          </div>

          {/* ── Mini entry card — bottom right ───────────────────────────── */}
          <div className="absolute right-[3%] bottom-[6%] -rotate-1">
            <div className="border-gl-border bg-gl-surface shadow-gl w-[204px] rounded-xl border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="bg-gl-learn-bg text-gl-learn rounded-full px-2 py-0.5 text-[10px] font-semibold">
                  Learning
                </span>
                <span className="bg-gl-primary-soft text-gl-primary rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums">
                  8 / 10
                </span>
              </div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="bg-gl-swatch-2 size-[5px] shrink-0 rounded-full" />
                <span className="text-gl-text-muted text-[10.5px]">Frontend / React</span>
              </div>
              <p className="text-gl-text-muted line-clamp-2 text-[11.5px] leading-snug italic">
                Deep-dived into React Server Components and cache invalidation patterns...
              </p>
            </div>
          </div>

          {/* Category chip + saved — right side mid */}
          <div className="absolute top-[38%] right-[4%] -rotate-2">
            <span className="border-gl-border bg-gl-surface-2 text-gl-text-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium">
              <span className="bg-gl-swatch-2 size-[5px] shrink-0 rounded-full" />
              Frontend / React
            </span>
          </div>
          <div className="absolute right-[5%] bottom-[28%] rotate-1">
            <span className="text-gl-primary text-[10.5px] font-medium">Saved · just now</span>
          </div>

          {/* ── Mini avg productivity card — mid left ────────────────────── */}
          <div className="absolute top-[44%] left-[3%] -rotate-1">
            <div className="border-gl-border bg-gl-surface shadow-gl w-[158px] rounded-xl border p-4">
              <p className="text-gl-text-faint text-[9px] font-bold tracking-[0.13em] uppercase">
                Avg productivity
              </p>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-gl-text text-[34px] leading-none font-bold tabular-nums">
                  8.4
                </span>
                <span className="text-gl-text-muted text-[14px] font-semibold">/10</span>
              </div>
              <p className="text-gl-text-faint mt-1 text-[10px]">across 147 entries</p>
            </div>
          </div>

          {/* ── Mini "this week" card — mid right ────────────────────────── */}
          <div className="absolute top-[42%] right-[3%] rotate-2">
            <div className="border-gl-border bg-gl-surface shadow-gl w-[158px] rounded-xl border p-4">
              <p className="text-gl-text-faint text-[9px] font-bold tracking-[0.13em] uppercase">
                This week
              </p>
              <p className="text-gl-text mt-1 text-[34px] leading-none font-bold tabular-nums">
                24
              </p>
              <div className="text-gl-text-muted mt-1 inline-flex items-center gap-1 text-[11px]">
                <span className="bg-gl-primary-soft text-gl-primary inline-flex size-4 items-center justify-center rounded">
                  <IconTrendUp size={11} />
                </span>
                +3 from last week
              </div>
            </div>
          </div>

          {/* Pills — left mid-lower gap */}
          <div className="absolute top-[64%] left-[5%] rotate-2">
            <span className="border-gl-border bg-gl-surface-2 text-gl-text-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium">
              <span className="bg-gl-swatch-4 size-[5px] shrink-0 rounded-full" />
              DevOps / Docker
            </span>
          </div>
          <div className="absolute bottom-[38%] left-[4%] -rotate-1">
            <span className="bg-gl-primary-soft text-gl-primary rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold">
              7 / 10
            </span>
          </div>
          <div className="absolute bottom-[20%] left-[6%] rotate-2">
            <span className="bg-gl-work-bg text-gl-work rounded-full px-2.5 py-1 text-[11px] font-semibold">
              Work
            </span>
          </div>

          {/* Pills — right mid-lower gap */}
          <div className="absolute top-[62%] right-[5%] -rotate-1">
            <span className="border-gl-border bg-gl-surface-2 text-gl-text-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium">
              <span className="bg-gl-swatch-3 size-[5px] shrink-0 rounded-full" />
              Personal / Writing
            </span>
          </div>
          <div className="absolute right-[5%] bottom-[40%] rotate-1">
            <span className="text-gl-text-faint font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
              15 MAY · Yesterday
            </span>
          </div>
          <div className="absolute right-[4%] bottom-[18%] -rotate-2">
            <span className="bg-gl-primary-soft text-gl-primary rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold">
              6 / 10
            </span>
          </div>

          {/* ── Top center — total entries stat + pill row ───────────────── */}
          <div className="absolute top-[2%] left-1/2 -translate-x-1/2 -rotate-1">
            <div className="border-gl-border bg-gl-surface shadow-gl w-[154px] rounded-xl border p-3.5 text-center">
              <p className="text-gl-text-faint text-[9px] font-bold tracking-[0.13em] uppercase">
                Total entries
              </p>
              <p className="text-gl-text mt-1 text-[34px] leading-none font-bold tabular-nums">
                342
              </p>
              <p className="text-gl-text-faint mt-0.5 text-[10px]">since you started</p>
            </div>
          </div>
          <div className="absolute top-[20%] left-1/2 flex -translate-x-1/2 rotate-1 items-center gap-2">
            <span className="bg-gl-work-bg text-gl-work rounded-full px-2.5 py-1 text-[11px] font-semibold">
              Work
            </span>
            <span className="bg-gl-primary-soft text-gl-primary rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold">
              9 / 10
            </span>
            <span className="border-gl-border bg-gl-surface-2 text-gl-text-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium">
              <span className="bg-gl-swatch-6 size-[5px] shrink-0 rounded-full" />
              System / CLI
            </span>
          </div>

          {/* ── Bottom center — weekly activity chart + pill row ─────────── */}
          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 rotate-1">
            <div className="border-gl-border bg-gl-surface shadow-gl w-[198px] rounded-xl border p-3.5">
              <p className="text-gl-text-faint text-[9px] font-bold tracking-[0.13em] uppercase">
                Weekly activity
              </p>
              <div className="mt-2.5 flex items-end justify-between gap-1">
                {([5, 8, 6, 9, 7, 3, 4] as const).map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-5 rounded-sm"
                      style={{
                        height: `${h * 3}px`,
                        background: i === 3 ? 'var(--gl-primary)' : 'var(--gl-surface-2)',
                        border: '1px solid var(--gl-border)',
                      }}
                    />
                    <span className="text-gl-text-faint font-mono text-[7px] uppercase">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-gl-text-muted mt-2 text-[10px]">5 / 7 days logged this week</p>
            </div>
          </div>
          <div className="absolute bottom-[20%] left-1/2 flex -translate-x-1/2 -rotate-1 items-center gap-2">
            <span className="border-gl-border bg-gl-surface-2 text-gl-text-muted inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium">
              <span className="bg-gl-swatch-5 size-[5px] shrink-0 rounded-full" />
              Career / Goals
            </span>
            <span className="bg-gl-learn-bg text-gl-learn rounded-full px-2.5 py-1 text-[11px] font-semibold">
              Learning
            </span>
          </div>
        </div>

        {/* Mobile logo — only shown when brand panel is hidden */}
        <div className="relative z-10 mb-10 flex items-center gap-2.5 lg:hidden">
          <Logo size={22} />
          <span className="text-gl-text text-[15px] font-bold tracking-tight">Grow Logs</span>
        </div>

        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
