'use client';

import { useState, useEffect } from 'react';
import { TypeBadge } from '@/components/common/type-badge';
import { IconCheck, IconPen, IconFolder, IconChart } from '@/components/common/icons';

// ── Log preview ───────────────────────────────────────────────────────────────

function PreviewLog(): JSX.Element {
  return (
    <div className="rounded-2xl border border-gl-border bg-gl-surface p-6 shadow-gl-lg">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.10em] text-gl-text-faint">
          15 MAY · Today
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gl-primary-soft px-2.5 py-1 font-mono text-[12px] font-semibold tabular-nums text-gl-primary">
          <span className="font-normal text-gl-primary/60">score</span> 8 / 10
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TypeBadge type="Work" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gl-border bg-gl-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-gl-text">
          <span className="size-[7px] shrink-0 rounded-full" style={{ background: '#69B598' }} aria-hidden="true" />
          Backend
          <span className="text-gl-text-faint">/</span>
          <span className="text-gl-text-muted">NestJS</span>
        </span>
      </div>

      <h4 className="mb-3 text-[20px] font-bold leading-[1.3] tracking-[-0.015em] text-gl-text">
        Refactored auth into a single guard.
      </h4>

      <p className="min-h-[64px] text-[14px] italic leading-[1.65] text-gl-text-muted">
        Pulled the refresh-token rotation out of the login handler. Tests dropped by half once the
        responsibilities were separated.
        <span
          className="ml-0.5 inline-block h-[13px] w-px translate-y-[2px] bg-gl-primary animate-cursor-blink"
          aria-hidden="true"
        />
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-gl-border pt-3.5">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-gl-primary">
          <span className="inline-flex size-[14px] items-center justify-center rounded-full bg-gl-primary-soft">
            <IconCheck size={9} />
          </span>
          Saved · just now
        </span>
        <kbd className="font-mono text-[11px] font-medium text-gl-text-faint">↵ enter</kbd>
      </div>
    </div>
  );
}

// ── Categories preview ────────────────────────────────────────────────────────

const CAT_DATA = [
  { name: 'Backend',      swatch: '#69B598', count: 38, subs: ['NestJS', 'PostgreSQL', 'Docker'] },
  { name: 'Reading',      swatch: '#B87DA2', count: 24, subs: ['DDIA', 'Tech blogs'] },
  { name: 'Side Project', swatch: '#C4A05E', count: 19, subs: ['Grow Logs', 'CSV import'] },
  { name: 'Soft Skills',  swatch: '#8285BA', count: 15, subs: ['1-on-1s', 'Writing'] },
] as const;

function PreviewCategories(): JSX.Element {
  return (
    <div className="rounded-2xl border border-gl-border bg-gl-surface p-6 shadow-gl-lg">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
        Your categories · 4 / 5
      </p>
      <div className="flex flex-col gap-2.5">
        {CAT_DATA.map(({ name, swatch, count, subs }) => (
          <div key={name} className="rounded-xl border border-gl-border bg-gl-surface-2 p-3.5">
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: swatch }} aria-hidden="true" />
              <span className="flex-1 text-[13.5px] font-semibold text-gl-text">{name}</span>
              <span className="font-mono text-[11px] tabular-nums text-gl-text-faint">{count} entries</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subs.map(sub => (
                <span
                  key={sub}
                  className="rounded-full border border-gl-border bg-gl-surface px-2 py-0.5 text-[11px] font-medium text-gl-text-muted"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Analytics preview ─────────────────────────────────────────────────────────

const CHART_WEEKS = [22, 38, 30, 52, 44, 64, 58, 78] as const;

function PreviewAnalytics(): JSX.Element {
  const max = 80;
  const w = 400;
  const h = 88;
  const pts = CHART_WEEKS.map((v, i) => [
    (i / (CHART_WEEKS.length - 1)) * w,
    h - (v / max) * h,
  ]);
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <div className="rounded-2xl border border-gl-border bg-gl-surface p-6 shadow-gl-lg space-y-3">
      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2.5">
        {([
          { label: 'Current streak', value: '12d',  color: 'text-gl-warning' },
          { label: 'Total entries',  value: '147',  color: 'text-gl-primary' },
          { label: 'Avg score',      value: '7.4',  color: 'text-gl-learn'   },
        ] as const).map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gl-border bg-gl-surface-2 p-3 text-center">
            <p className={`font-mono text-[22px] font-bold leading-none tabular-nums ${color}`}>{value}</p>
            <p className="mt-1.5 text-[10px] leading-tight text-gl-text-faint">{label}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border border-gl-border bg-gl-surface-2 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-medium text-gl-text-muted">Activity · last 8 weeks</span>
          <span className="font-mono text-[11px] font-semibold text-gl-primary">↗ +28%</span>
        </div>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="block h-[88px] w-full"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <path d={areaPath} fill="var(--gl-primary)" opacity="0.12" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--gl-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pts.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === pts.length - 1 ? 4 : 0}
              fill="var(--gl-primary)"
            />
          ))}
        </svg>
      </div>

      {/* Activity split */}
      <div className="rounded-xl border border-gl-border bg-gl-surface-2 px-4 py-3.5">
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">Activity split · this month</p>
        <div className="flex items-center gap-3">
          <span className="w-10 text-right font-mono text-[12px] font-semibold text-gl-work">58%</span>
          <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gl-bg-subtle">
            <div className="h-full rounded-full" style={{ width: '58%', background: 'var(--gl-work-fg)' }} />
          </div>
          <span className="text-[11px] text-gl-text-muted">Work</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="w-10 text-right font-mono text-[12px] font-semibold text-gl-learn">42%</span>
          <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gl-bg-subtle">
            <div className="h-full rounded-full" style={{ width: '42%', background: 'var(--gl-learn-fg)' }} />
          </div>
          <span className="text-[11px] text-gl-text-muted">Learning</span>
        </div>
      </div>
    </div>
  );
}

// ── Feature data ──────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tab: string;
  title: string;
  body: string;
  bullets: readonly string[];
  preview: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    icon: IconPen,
    tab: 'Log',
    title: 'Log work and learning separately.',
    body: 'Tag every entry as Work or Learning. Add a productivity score to reflect how focused and effective you felt. Build an honest record, not just a list.',
    bullets: [
      'Work vs Learning type tagging on every entry',
      'Productivity score out of 10 for honest reflection',
      'Markdown body with real-time typewriter feedback',
    ],
    preview: <PreviewLog />,
  },
  {
    icon: IconFolder,
    tab: 'Organise',
    title: 'Organised by your own categories.',
    body: 'Define up to 5 main categories and their sub-categories — Backend, System Design, Soft Skills, whatever fits your journey. Every entry belongs somewhere meaningful.',
    bullets: [
      'Up to 5 custom top-level categories',
      'Sub-categories for precision without complexity',
      'Colour-coded consistently across every view',
    ],
    preview: <PreviewCategories />,
  },
  {
    icon: IconChart,
    tab: 'Review',
    title: 'See your progress over time.',
    body: 'Your dashboard shows activity breakdowns, productivity trends, and a full log history. Know exactly what to say in your next interview or performance review.',
    bullets: [
      'Weekly activity trend with percentage growth',
      'Work vs Learning split for the month',
      'Streak tracking and scoring history at a glance',
    ],
    preview: <PreviewAnalytics />,
  },
];

// ── Section ───────────────────────────────────────────────────────────────────

const INTERVAL_MS = 5000;
const FADE_MS = 260;

export function FeaturesSection(): JSX.Element {
  const [active, setActive] = useState(0);       // desired tab (drives timer + pill highlight)
  const [displayed, setDisplayed] = useState(0); // tab whose content is actually rendered
  const [visible, setVisible] = useState(true);  // false = fading out, true = faded in

  // Auto-advance: every time active changes (click or timer), restart the 5s clock.
  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(prev => (prev + 1) % FEATURES.length);
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [active]);

  // When active diverges from displayed, fade out → swap content → fade in.
  // Cleanup cancels the pending swap if active changes again mid-transition.
  useEffect(() => {
    if (active === displayed) return;
    setVisible(false);
    const timer = setTimeout(() => {
      setDisplayed(active);
      setVisible(true);
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [active, displayed]);

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-20">
      {/* Header */}
      <div className="mx-auto mb-8 max-w-[680px] text-center">
        <h2 className="mb-3.5 text-[36px] font-bold leading-[1.08] tracking-[-0.025em] text-gl-text text-balance sm:text-[44px] sm:tracking-[-0.028em]">
          Everything you need to track your growth.
        </h2>
        <p className="text-[17px] leading-[1.55] text-gl-text-muted text-pretty">
          One place for your work logs and your learning — structured, searchable, and always
          there when you need it.
        </p>
      </div>

      {/* Tab pills */}
      <div className="mb-10 flex justify-center gap-2">
        {FEATURES.map(({ icon: Icon, tab }, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={`relative overflow-hidden inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-150 sm:gap-2 sm:px-5 sm:py-2 sm:text-[13px] ${
              active === i
                ? 'border-gl-primary/30 bg-gl-primary-soft text-gl-primary'
                : 'border-gl-border bg-gl-surface text-gl-text-muted hover:border-gl-border-input hover:text-gl-text'
            }`}
          >
            <Icon size={14} />
            {tab}
            {active === i && (
              <span
                className="absolute bottom-0 left-0 h-[2px] w-full animate-tab-progress bg-gl-primary opacity-60"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content — opacity + lift transition; displayed lags active by FADE_MS */}
      <div
        className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(10px)',
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        }}
      >
        {/* Left: copy */}
        <div>
          <h3 className="mb-4 text-[28px] font-bold leading-[1.18] tracking-[-0.022em] text-gl-text text-balance sm:text-[32px]">
            {FEATURES[displayed].title}
          </h3>
          <p className="mb-7 text-[16px] leading-[1.65] text-gl-text-muted">
            {FEATURES[displayed].body}
          </p>
          <ul className="flex flex-col gap-3.5">
            {FEATURES[displayed].bullets.map(bullet => (
              <li key={bullet} className="flex items-start gap-3 text-[14.5px] text-gl-text-muted">
                <span className="mt-[3px] inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-gl-primary-soft text-gl-primary">
                  <IconCheck size={10} />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: rich preview */}
        <div>{FEATURES[displayed].preview}</div>
      </div>
    </section>
  );
}
