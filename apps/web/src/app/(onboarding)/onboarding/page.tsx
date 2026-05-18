'use client';

// Onboarding wizard — 3-step flow with a step-aware left brand panel.
// The left panel explains what the current step does and shows relevant widgets.
// The right panel renders the interactive step component.
// Used by: app/(onboarding)/layout.tsx
import { useState, useEffect, type JSX } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/common/logo';
import { IconCheck } from '@/components/common/icons';
import { OnboardingStep1 } from '@/components/onboarding/onboarding-step1';
import { OnboardingStep2 } from '@/components/onboarding/onboarding-step2';
import { OnboardingStep3 } from '@/components/onboarding/onboarding-step3';

// ── Step 1 — Category preview widget ──────────────────────────────────────────

const CATEGORY_PREVIEWS = [
  {
    name: 'Backend Development',
    color: '#8285BA',
    subs: ['Node.js', 'REST APIs', 'Auth'],
    count: 24,
  },
  { name: 'Frontend', color: '#69B598', subs: ['React', 'Next.js'], count: 18 },
  { name: 'DevOps', color: '#62AEBF', subs: ['Docker', 'CI/CD'], count: 9 },
] as const;

const CATEGORY_FEATURES = [
  'Organise entries by your own categories and subcategories',
  'Colour-coded workspace tailored to how you think',
  'See where your time and energy go — by category',
] as const;

function CategoryWidget(): JSX.Element {
  return (
    <div className="space-y-2.5">
      {CATEGORY_PREVIEWS.map((cat) => (
        <div
          key={cat.name}
          className="border-gl-border bg-gl-surface shadow-gl rounded-xl border px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: cat.color }}
                aria-hidden="true"
              />
              <span className="text-gl-text text-[13px] font-semibold">{cat.name}</span>
            </div>
            <span className="text-gl-text-faint font-mono text-[10px]">{cat.count} entries</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cat.subs.map((sub) => (
              <span
                key={sub}
                className="border-gl-border text-gl-text-muted rounded-full border px-2 py-0.5 text-[10px]"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Step 2 — Subcategory preview widget ───────────────────────────────────────

const SUBCAT_PREVIEWS = [
  {
    name: 'Backend Development',
    color: '#8285BA',
    subs: ['Node.js', 'REST APIs', 'Auth & Security', 'Testing'],
  },
  {
    name: 'Frontend',
    color: '#69B598',
    subs: ['React', 'Next.js', 'TypeScript', 'CSS'],
  },
  {
    name: 'DevOps & Cloud',
    color: '#62AEBF',
    subs: ['Docker', 'CI/CD', 'Kubernetes'],
  },
] as const;

const SUBCAT_FEATURES = [
  'Break broad topics into precise, searchable focus areas',
  'Track time on specific technologies, not just subjects',
  'Filter and analyse by subcategory on your dashboard',
] as const;

function SubcategoryWidget(): JSX.Element {
  return (
    <div className="space-y-2.5">
      {SUBCAT_PREVIEWS.map((cat) => (
        <div
          key={cat.name}
          className="border-gl-border bg-gl-surface shadow-gl rounded-xl border px-4 py-3"
        >
          <div className="mb-2.5 flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: cat.color }}
              aria-hidden="true"
            />
            <span className="text-gl-text text-[12.5px] font-semibold">{cat.name}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cat.subs.map((sub) => (
              <span
                key={sub}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium"
                style={{
                  background: `${cat.color}18`,
                  color: cat.color,
                  border: `1px solid ${cat.color}30`,
                }}
              >
                <span
                  className="size-1 shrink-0 rounded-full"
                  style={{ background: cat.color }}
                  aria-hidden="true"
                />
                {sub}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Step 3 — Dashboard preview widget ────────────────────────────────────────

const ACTIVITY_BARS = [3, 5, 2, 7, 4, 6, 3] as const;
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const CATEGORY_BREAKDOWN = [
  { name: 'Backend Dev', color: '#8285BA', pct: 48 },
  { name: 'Frontend', color: '#69B598', pct: 35 },
  { name: 'DevOps', color: '#62AEBF', pct: 17 },
] as const;

const DASHBOARD_FEATURES = [
  'Track daily streaks to build consistent habits',
  'Score your productivity from 1 – 10 per entry',
  'See time distribution by category at a glance',
] as const;

function DashboardWidget(): JSX.Element {
  const maxBar = Math.max(...ACTIVITY_BARS);

  return (
    <div className="space-y-2.5">
      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { label: 'Streak', value: '12d', color: '#2EB8A0' },
            { label: 'Entries', value: '47', color: '#8285BA' },
            { label: 'Avg score', value: '8.2', color: '#69B598' },
          ] as const
        ).map((stat) => (
          <div
            key={stat.label}
            className="border-gl-border bg-gl-surface shadow-gl flex flex-col items-center rounded-xl border px-2 py-3"
          >
            <span
              className="size-2 rounded-full"
              style={{ background: stat.color }}
              aria-hidden="true"
            />
            <span className="text-gl-text mt-1.5 text-[15px] leading-none font-bold tabular-nums">
              {stat.value}
            </span>
            <span className="text-gl-text-faint mt-1 text-[9px] font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="border-gl-border bg-gl-surface shadow-gl rounded-xl border px-4 py-3">
        <p className="text-gl-text-faint mb-3 text-[9.5px] font-semibold tracking-[0.08em] uppercase">
          Activity this week
        </p>
        <div className="flex h-10 items-end gap-1.5">
          {ACTIVITY_BARS.map((count, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-[3px]"
                style={{
                  height: `${(count / maxBar) * 100}%`,
                  background: i === 3 ? '#2EB8A0' : 'rgba(46,184,160,0.3)',
                }}
              />
              <span className="text-gl-text-faint text-[8.5px]">{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="border-gl-border bg-gl-surface shadow-gl rounded-xl border px-4 py-3">
        <p className="text-gl-text-faint mb-3 text-[9.5px] font-semibold tracking-[0.08em] uppercase">
          By category
        </p>
        <div className="space-y-2.5">
          {CATEGORY_BREAKDOWN.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: cat.color }}
                aria-hidden="true"
              />
              <span className="text-gl-text-muted w-[70px] shrink-0 truncate text-[10.5px]">
                {cat.name}
              </span>
              <div className="bg-gl-surface-2 h-1.5 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${cat.pct}%`, background: cat.color }}
                />
              </div>
              <span className="text-gl-text-faint w-6 text-right font-mono text-[10px]">
                {cat.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shared feature list ───────────────────────────────────────────────────────

function FeatureList({ features }: { features: readonly string[] }): JSX.Element {
  return (
    <ul className="space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5">
          <span className="bg-gl-primary text-gl-primary-ink mt-px inline-flex size-[18px] shrink-0 items-center justify-center rounded-full">
            <IconCheck size={10} />
          </span>
          <span className="text-gl-text-muted text-[13px] leading-relaxed">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Left panel content per step ───────────────────────────────────────────────

function Step1LeftContent(): JSX.Element {
  return (
    <div className="flex flex-1 flex-col justify-center gap-7">
      <div>
        <p className="text-[28px] leading-[1.2] font-bold tracking-[-0.02em] xl:text-[32px]">
          <span className="bg-gradient-to-r from-[#2EB8A0] to-[#7DDFD0] bg-clip-text text-transparent">
            Your workspace,
          </span>
          <br />
          <span className="text-gl-text">your categories.</span>
        </p>
        <p className="text-gl-text-muted mt-3 text-[13.5px] leading-relaxed">
          Categories are the top-level buckets for everything you log — Backend, Frontend, Reading.
          Create ones that match how you work and learn.
        </p>
      </div>
      <CategoryWidget />
      <FeatureList features={CATEGORY_FEATURES} />
    </div>
  );
}

function Step2LeftContent(): JSX.Element {
  return (
    <div className="flex flex-1 flex-col justify-center gap-7">
      <div>
        <p className="text-[28px] leading-[1.2] font-bold tracking-[-0.02em] xl:text-[32px]">
          <span className="bg-gradient-to-r from-[#2EB8A0] to-[#7DDFD0] bg-clip-text text-transparent">
            Focus on what
          </span>
          <br />
          <span className="text-gl-text">matters most.</span>
        </p>
        <p className="text-gl-text-muted mt-3 text-[13.5px] leading-relaxed">
          Subcategories break each category into precise topics — track Node.js separately from REST
          APIs, not just &ldquo;Backend&rdquo;.
        </p>
      </div>
      <SubcategoryWidget />
      <FeatureList features={SUBCAT_FEATURES} />
    </div>
  );
}

function Step3LeftContent(): JSX.Element {
  return (
    <div className="flex flex-1 flex-col justify-center gap-7">
      <div>
        <p className="text-[28px] leading-[1.2] font-bold tracking-[-0.02em] xl:text-[32px]">
          <span className="bg-gradient-to-r from-[#2EB8A0] to-[#7DDFD0] bg-clip-text text-transparent">
            Your growth,
          </span>
          <br />
          <span className="text-gl-text">visualised.</span>
        </p>
        <p className="text-gl-text-muted mt-3 text-[13.5px] leading-relaxed">
          Every entry you log becomes part of your growth story — tracked by category, date, and
          productivity score.
        </p>
      </div>
      <DashboardWidget />
      <FeatureList features={DASHBOARD_FEATURES} />
    </div>
  );
}

// ── Step bar ──────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Categories', 'Subcategories', 'All set'] as const;

function StepBar({ current, total }: { current: number; total: number }): JSX.Element {
  return (
    <div className="mb-8 flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 rounded-full transition-all duration-500',
              i + 1 <= current ? 'bg-gl-primary w-6' : 'bg-gl-border w-3',
            )}
          />
        ))}
      </div>
      <span className="text-gl-text-faint text-[11.5px]">
        <span className="text-gl-text-muted font-semibold">{STEP_LABELS[current - 1]}</span>
        <span className="font-medium">
          {' '}
          · {current} / {total}
        </span>
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage(): JSX.Element | null {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categoryCount, setCategoryCount] = useState(0);

  useEffect(() => {
    if (user?.onboardingCompleted) {
      void router.replace('/dashboard');
    }
  }, [user, router]);

  if (user?.onboardingCompleted) return null;

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      {/* ── Left brand panel — hidden on mobile ─────────────────────────────── */}
      <div className="bg-gl-bg-subtle hidden flex-col px-10 py-10 lg:flex lg:w-[440px] xl:w-[500px]">
        <Link href="/" className="flex w-fit items-center gap-2.5">
          <Logo size={22} />
          <span className="text-gl-text text-[15px] font-bold tracking-tight">Grow Logs</span>
        </Link>

        {/* Content animates on step change */}
        <div
          key={step}
          className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-1 flex-col duration-300"
        >
          {step === 1 && <Step1LeftContent />}
          {step === 2 && <Step2LeftContent />}
          {step === 3 && <Step3LeftContent />}
        </div>

        <p className="text-gl-text-faint mt-8 text-[11px]">
          © {new Date().getFullYear()} Grow Logs. All rights reserved.
        </p>
      </div>

      {/* ── Wizard column ────────────────────────────────────────────────────── */}
      <div className="bg-gl-bg flex flex-1 flex-col px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <Logo size={22} />
          <span className="text-gl-text text-[15px] font-bold tracking-tight">Grow Logs</span>
        </div>

        <div className="flex flex-1 flex-col">
          <StepBar current={step} total={3} />

          <div
            key={step}
            className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-1 flex-col duration-300"
          >
            {step === 1 && <OnboardingStep1 onContinue={() => setStep(2)} />}
            {step === 2 && (
              <OnboardingStep2
                onContinue={(count) => {
                  setCategoryCount(count);
                  setStep(3);
                }}
              />
            )}
            {step === 3 && <OnboardingStep3 categoryCount={categoryCount} />}
          </div>
        </div>
      </div>
    </div>
  );
}
