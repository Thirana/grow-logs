'use client';

import { useRef, useState, useEffect } from 'react';
import { TypeBadge } from '@/components/common/type-badge';
import { IconCheck, IconFolder, IconPen, IconChart } from '@/components/common/icons';
import { FadeIn } from '@/components/common/fade-in';

// ── Step 1 preview — category list ───────────────────────────────────────────

function StepPreviewCategories() {
  const cats = [
    { name: 'Backend',      swatch: '#69B598', subs: ['NestJS', 'Auth'] },
    { name: 'Reading',      swatch: '#B87DA2', subs: ['DDIA'] },
    { name: 'Side Project', swatch: '#C4A05E', subs: ['Grow Logs'] },
  ] as const;

  return (
    <div className="border-y border-gl-border py-4 flex flex-col gap-2.5">
      {cats.map(({ name, swatch, subs }, i) => (
        <div
          key={name}
          className={`flex items-center gap-2.5 ${i < cats.length - 1 ? 'pb-2.5 border-b border-gl-border' : ''}`}
        >
          <span className="size-2 shrink-0 rounded-full" style={{ background: swatch }} aria-hidden="true" />
          <span className="flex-1 text-[12.5px] font-semibold text-gl-text">{name}</span>
          <div className="flex gap-1">
            {subs.map(s => (
              <span key={s} className="rounded-full border border-gl-border px-1.5 py-0.5 text-[10px] font-medium text-gl-text-muted">
                {s}
              </span>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-gl-text-faint">+ Add category</p>
    </div>
  );
}

// ── Step 2 preview — log entry ────────────────────────────────────────────────

function StepPreviewLog() {
  return (
    <div className="border-y border-gl-border py-4 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type="Work" />
        <span className="flex items-center gap-1 text-[11px] text-gl-text-muted">
          <span className="size-[6px] rounded-full" style={{ background: '#69B598' }} aria-hidden="true" />
          Backend
          <span className="text-gl-text-faint">/</span>
          NestJS
        </span>
        <span className="ml-auto font-mono text-[11px] font-semibold text-gl-primary">8 / 10</span>
      </div>

      <p className="border-t border-gl-border pt-2.5 text-[12px] italic leading-[1.55] text-gl-text-muted">
        Refactored auth into a single guard. Tests dropped by half once responsibilities were separated.
        <span className="ml-0.5 inline-block h-[11px] w-px translate-y-[1px] animate-cursor-blink bg-gl-primary" aria-hidden="true" />
      </p>

      <div className="flex items-center gap-1.5 border-t border-gl-border pt-2.5 text-[11px] font-medium text-gl-primary">
        <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-gl-primary-soft">
          <IconCheck size={8} />
        </span>
        Saved · just now
      </div>
    </div>
  );
}

// ── Step 3 preview — progress stats + chart ───────────────────────────────────

const CHART_BARS = [22, 30, 38, 44, 52, 58, 64, 78] as const;

function StepPreviewProgress() {
  const max = 80;
  return (
    <div className="border-y border-gl-border py-4 flex flex-col gap-3">
      <div className="grid grid-cols-3 divide-x divide-gl-border text-center">
        {([
          { label: 'entries',   value: '147', color: 'text-gl-primary' },
          { label: 'streak',    value: '9d',  color: 'text-gl-warning' },
          { label: 'avg score', value: '7.4', color: 'text-gl-learn'   },
        ] as const).map(({ label, value, color }) => (
          <div key={label} className="px-2">
            <p className={`font-mono text-[20px] font-bold leading-none tabular-nums ${color}`}>{value}</p>
            <p className="mt-1 text-[9px] text-gl-text-faint">{label}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gl-border pt-3">
        <div className="flex items-end gap-[3px]" style={{ height: 40 }}>
          {CHART_BARS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[2px] bg-gl-primary"
              style={{ height: `${(h / max) * 100}%`, opacity: 0.3 + (i / CHART_BARS.length) * 0.7 }}
            />
          ))}
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-gl-text-faint">
          Activity · last 8 weeks
          <span className="text-gl-primary">↗ +28%</span>
        </p>
      </div>
    </div>
  );
}

// ── Step data ─────────────────────────────────────────────────────────────────

interface Step {
  n: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  Preview: React.ComponentType;
}

const STEPS: Step[] = [
  {
    n: '01', icon: IconFolder, iconBg: 'bg-gl-primary-soft', iconColor: 'text-gl-primary',
    title: 'Set up your categories.',
    body: 'Define the areas you are tracking: your stack, your learning topics, your goals. Takes two minutes.',
    Preview: StepPreviewCategories,
  },
  {
    n: '02', icon: IconPen, iconBg: 'bg-gl-warning-soft', iconColor: 'text-gl-warning',
    title: 'Log something every day.',
    body: 'Takes less than a minute. A sentence, a bullet list, or a full reflection, whatever feels right.',
    Preview: StepPreviewLog,
  },
  {
    n: '03', icon: IconChart, iconBg: 'bg-gl-learn-bg', iconColor: 'text-gl-learn',
    title: 'Watch your progress appear.',
    body: 'Your dashboard fills up. Your categories grow. Your growth becomes visible and articulable.',
    Preview: StepPreviewProgress,
  },
];

// ── Section ───────────────────────────────────────────────────────────────────

export function HowItWorks() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveCard(idx);
          }
        });
      },
      { root: container, threshold: 0.6 },
    );

    cardRefs.current.forEach(card => { if (card) observer.observe(card); });
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how" className="py-12 sm:py-16 lg:pt-16 lg:pb-12">
      <FadeIn>
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <h2 className="text-[36px] font-bold leading-[1.08] tracking-[-0.025em] text-gl-text text-balance sm:text-[44px] sm:tracking-[-0.028em]">
            Up and running in minutes.
          </h2>
        </div>
      </FadeIn>

      <FadeIn delay={130}>
      <div className="relative">
        <div
          ref={scrollRef}
          className="relative no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:gap-5 sm:snap-none sm:overflow-visible"
        >
          {/* Connector line — desktop only, positioned at icon badge centre */}
          <div
            className="pointer-events-none absolute top-[44px] left-[16.66%] right-[16.66%] hidden h-px sm:block"
            style={{ background: `linear-gradient(to right, transparent, var(--gl-border) 12%, var(--gl-border) 88%, transparent)` }}
            aria-hidden="true"
          />

          {STEPS.map(({ n, icon: Icon, iconBg, iconColor, title, body, Preview }, i) => (
            <div
              key={n}
              ref={el => { cardRefs.current[i] = el; }}
              className="relative z-10 flex w-[82%] min-w-[82%] flex-shrink-0 snap-start flex-col gap-5 rounded-2xl border border-gl-border bg-gl-surface p-6 shadow-gl transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg sm:w-auto sm:min-w-0"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex size-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                  <Icon size={18} />
                </span>
                <span className="font-mono text-[28px] font-bold tabular-nums text-gl-border">{n}</span>
              </div>

              <Preview />

              <div>
                <h3 className="mb-2 text-[18px] font-bold leading-[1.25] tracking-[-0.018em] text-gl-text">
                  {title}
                </h3>
                <p className="text-[14px] leading-[1.65] text-gl-text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right fade — signals more cards on mobile */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gl-bg to-transparent sm:hidden"
          aria-hidden="true"
        />
      </div>

      {/* Scroll dots — mobile only */}
      <div className="mt-5 flex justify-center gap-2 sm:hidden" role="tablist" aria-label="Step cards">
        {STEPS.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={activeCard === i}
            aria-label={`Step ${i + 1} of ${STEPS.length}`}
            onClick={() =>
              cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
            }
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeCard === i ? 'w-5 bg-gl-primary' : 'w-1.5 bg-gl-border hover:bg-gl-text-faint'
            }`}
          />
        ))}
      </div>
      </FadeIn>
    </section>
  );
}
