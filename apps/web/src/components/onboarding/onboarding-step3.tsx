'use client';

// Onboarding step 3 — completion summary, 3-card quick-start guide, and redirect.
// Used by: app/(onboarding)/onboarding/page.tsx
import { type JSX } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { IconCheck, IconArrowRight } from '@/components/common/icons';
import { TypeBadge } from '@/components/common/type-badge';
import { useCompleteOnboarding } from '@/hooks/use-onboarding';
import { getApiErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

// ── Shared step badge ─────────────────────────────────────────────────────────

function StepBadge({ n }: { n: string }): JSX.Element {
  return (
    <span className="bg-gl-primary text-gl-primary-ink inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
      {n}
    </span>
  );
}

// ── Card 1 — Log an entry ─────────────────────────────────────────────────────

function Card1LogEntry(): JSX.Element {
  return (
    <div className="border-gl-border bg-gl-surface shadow-gl relative overflow-hidden rounded-2xl border p-5">
      <div className="relative mb-4 flex items-center gap-3">
        <StepBadge n="1" />
        <div>
          <p className="text-gl-text text-[14px] font-semibold">Log an entry</p>
          <p className="text-gl-text-muted text-[11.5px]">
            Capture what you built or studied today
          </p>
        </div>
      </div>

      {/* Two mini entry cards — one WORK, one LEARNING */}
      <div className="relative grid grid-cols-2 gap-3">
        {/* WORK entry */}
        <div className="border-gl-border bg-gl-bg rounded-xl border p-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-1.5">
            <TypeBadge type="WORK" />
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tabular-nums"
              style={{ background: 'rgba(46,184,160,0.12)', color: '#2EB8A0' }}
            >
              9&thinsp;/&thinsp;10
            </span>
          </div>
          <p className="text-gl-text-faint mb-1.5 text-[10px]">Backend Dev · Node.js</p>
          <p className="text-gl-text text-[11.5px] leading-snug">
            Built JWT refresh token rotation with reuse detection.
          </p>
          <p className="text-gl-text-faint mt-2 text-[10px]">Today · 3:45 PM</p>
        </div>

        {/* LEARNING entry */}
        <div className="border-gl-border bg-gl-bg rounded-xl border p-3.5">
          <div className="mb-2.5">
            <TypeBadge type="LEARNING" />
          </div>
          <p className="text-gl-text-faint mb-1.5 text-[10px]">Reading · System Design</p>
          <p className="text-gl-text text-[11.5px] leading-snug">
            Studied consistent hashing and its role in distributed caching.
          </p>
          <p className="text-gl-text-faint mt-2 text-[10px]">Today · 1:20 PM</p>
        </div>
      </div>

      <p className="text-gl-text-muted relative mt-4 text-[12.5px] leading-relaxed">
        From the dashboard tap <span className="text-gl-text font-semibold">+ New entry</span> to
        log what you worked on. Entries take about 30 seconds to write.
      </p>
    </div>
  );
}

// ── Card 2 — WORK vs LEARNING ─────────────────────────────────────────────────

function Card2WorkVsLearning(): JSX.Element {
  return (
    <div className="border-gl-border bg-gl-surface shadow-gl relative overflow-hidden rounded-2xl border p-5">
      <div className="relative mb-4 flex items-center gap-3">
        <StepBadge n="2" />
        <div>
          <p className="text-gl-text text-[14px] font-semibold">Two entry types</p>
          <p className="text-gl-text-muted text-[11.5px]">
            Choose between WORK and LEARNING each time
          </p>
        </div>
      </div>

      {/* Activity split — HeroSplitWidget-style visualization */}
      <div className="bg-gl-bg border-gl-border relative overflow-hidden rounded-xl border p-4">
        <p className="text-gl-text-faint mb-4 text-[9.5px] font-semibold tracking-[0.08em] uppercase">
          Activity split · this month
        </p>
        <div className="space-y-3.5">
          {/* WORK bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <TypeBadge type="WORK" />
              <span className="text-gl-work font-mono text-[13px] font-bold tabular-nums">62%</span>
            </div>
            <div className="bg-gl-surface h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{ width: '62%', background: 'var(--gl-work-fg)' }}
              />
            </div>
          </div>

          {/* LEARNING bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <TypeBadge type="LEARNING" />
              <span className="text-gl-learn font-mono text-[13px] font-bold tabular-nums">
                38%
              </span>
            </div>
            <div className="bg-gl-surface h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{ width: '38%', background: 'var(--gl-learn-fg)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Type descriptions */}
      <div className="relative mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <TypeBadge type="WORK" className="mt-px shrink-0" />
          <p className="text-gl-text-muted text-[12px] leading-relaxed">
            Code shipped, bugs fixed, PRs reviewed — anything you produced and shipped.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <TypeBadge type="LEARNING" className="mt-px shrink-0" />
          <p className="text-gl-text-muted text-[12px] leading-relaxed">
            Docs read, courses done, books studied — anything you absorbed and understood.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Card 3 — Productivity score ───────────────────────────────────────────────

// Colors per score: warm (low) → amber (mid) → teal (high) → bright (peak)
const SCORE_COLOR: Record<number, string> = {
  1: '#B87060',
  2: '#B87060',
  3: '#B87060',
  4: '#C4A05E',
  5: '#C4A05E',
  6: '#C4A05E',
  7: '#2EB8A0',
  8: '#2EB8A0',
  9: '#2EB8A0',
  10: '#7DDFD0',
};

const SCORE_RANGES = [
  { range: '1–3', label: 'Challenging', color: '#B87060' },
  { range: '4–6', label: 'Steady', color: '#C4A05E' },
  { range: '7–9', label: 'Productive', color: '#2EB8A0' },
  { range: '10', label: 'Peak', color: '#7DDFD0' },
] as const;

function Card3Score(): JSX.Element {
  const exampleScore = 8;

  return (
    <div className="border-gl-border bg-gl-surface shadow-gl relative overflow-hidden rounded-2xl border p-5">
      <div className="relative mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StepBadge n="3" />
          <div>
            <p className="text-gl-text text-[14px] font-semibold">Productivity score</p>
            <p className="text-gl-text-muted text-[11.5px]">Rate each session from 1 to 10</p>
          </div>
        </div>
        <span
          className="shrink-0 rounded-lg px-2.5 py-1 text-[11.5px] font-bold tabular-nums"
          style={{ background: 'rgba(46,184,160,0.12)', color: '#2EB8A0' }}
        >
          {exampleScore}&thinsp;/&thinsp;10
        </span>
      </div>

      {/* Score bar — 10 coloured segments, active bar taller */}
      <div className="bg-gl-bg border-gl-border relative mb-4 overflow-hidden rounded-xl border p-4">
        <div className="flex h-10 items-end gap-1.5">
          {Array.from({ length: 10 }, (_, i) => {
            const s = i + 1;
            const isActive = s === exampleScore;
            const isFilled = s <= exampleScore;
            const color = SCORE_COLOR[s];
            return (
              <div
                key={s}
                className="flex-1 rounded-t-[3px] transition-all"
                style={{
                  height: isActive ? '100%' : isFilled ? '65%' : '18%',
                  background: isFilled ? color : `${color}1F`,
                }}
              />
            );
          })}
        </div>
        <div className="mt-2.5 flex justify-between">
          <span className="text-gl-text-faint text-[10px]">1 — Tough day</span>
          <span className="text-gl-text-faint text-[10px]">10 — Peak day</span>
        </div>
      </div>

      {/* Range legend — 4 labelled tiles */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {SCORE_RANGES.map((r) => (
          <div
            key={r.range}
            className="rounded-lg border px-2 py-2 text-center"
            style={{ background: `${r.color}10`, borderColor: `${r.color}28` }}
          >
            <p
              className="text-[11px] leading-none font-bold tabular-nums"
              style={{ color: r.color }}
            >
              {r.range}
            </p>
            <p className="text-gl-text-faint mt-1 text-[9.5px] leading-none">{r.label}</p>
          </div>
        ))}
      </div>

      <p className="text-gl-text-muted text-[12.5px] leading-relaxed">
        Over time you&apos;ll spot patterns — which days, topics, and conditions put you at your
        best.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface OnboardingStep3Props {
  categoryCount: number;
}

export function OnboardingStep3({ categoryCount }: OnboardingStep3Props): JSX.Element {
  const completeOnboarding = useCompleteOnboarding();

  function handleComplete(): void {
    completeOnboarding.mutate(undefined, {
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  }

  const categoryLabel = categoryCount === 1 ? 'category' : 'categories';

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="my-auto w-full space-y-4 py-4">
        {/* ── Success header ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="bg-gl-primary flex size-14 shrink-0 items-center justify-center rounded-full">
            <IconCheck size={22} className="text-gl-primary-ink" />
          </div>
          <div>
            <h1 className="text-gl-text text-[22px] leading-tight font-bold tracking-[-0.02em]">
              You&apos;re all set!
            </h1>
            <p className="text-gl-text-muted mt-0.5 text-[13px]">
              <span className="text-gl-text font-semibold">
                {categoryCount} {categoryLabel} created
              </span>
              . Your workspace is ready to use.
            </p>
          </div>
        </div>

        {/* ── Quick-start guide cards ─────────────────────────────────────── */}
        <Card1LogEntry />
        <Card2WorkVsLearning />
        <Card3Score />

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleComplete}
          disabled={completeOnboarding.isPending}
          className={cn(
            'bg-gl-primary text-gl-primary-ink hover:bg-gl-primary-hover',
            'inline-flex w-full cursor-pointer items-center justify-center gap-2',
            'rounded-lg py-3 text-[14px] font-semibold',
            'focus-visible:ring-gl-primary/40 transition-colors focus-visible:ring-2 focus-visible:outline-none',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          {completeOnboarding.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Setting up…
            </>
          ) : (
            <>
              Go to dashboard
              <IconArrowRight size={13} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
