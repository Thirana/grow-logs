'use client';

import { useRef, useState, useEffect } from 'react';
import { TypeBadge } from '@/components/common/type-badge';
import { IconCheck, IconFolder, IconPen, IconChart } from '@/components/common/icons';
import { FadeIn } from '@/components/common/fade-in';

// ── Step 1 preview — category list ───────────────────────────────────────────

function StepPreviewCategories() {
  const cats = [
    { name: 'Backend', swatch: '#69B598', subs: ['NestJS', 'Auth'] },
    { name: 'Reading', swatch: '#B87DA2', subs: ['DDIA'] },
    { name: 'Side Project', swatch: '#C4A05E', subs: ['Grow Logs'] },
  ] as const;

  return (
    <div className="border-gl-border flex flex-col gap-2.5 border-y py-4">
      {cats.map(({ name, swatch, subs }, i) => (
        <div
          key={name}
          className={`flex items-center gap-2.5 ${i < cats.length - 1 ? 'border-gl-border border-b pb-2.5' : ''}`}
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: swatch }}
            aria-hidden="true"
          />
          <span className="text-gl-text flex-1 text-[12.5px] font-semibold">{name}</span>
          <div className="flex gap-1">
            {subs.map((s) => (
              <span
                key={s}
                className="border-gl-border text-gl-text-muted rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ))}
      <p className="text-gl-text-faint text-[11px]">+ Add category</p>
    </div>
  );
}

// ── Step 2 preview — log entry ────────────────────────────────────────────────

function StepPreviewLog() {
  return (
    <div className="border-gl-border flex flex-col gap-2.5 border-y py-4">
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type="Work" />
        <span className="text-gl-text-muted flex items-center gap-1 text-[11px]">
          <span
            className="size-[6px] rounded-full"
            style={{ background: '#69B598' }}
            aria-hidden="true"
          />
          Backend
          <span className="text-gl-text-faint">/</span>
          NestJS
        </span>
        <span className="text-gl-primary ml-auto font-mono text-[11px] font-semibold">8 / 10</span>
      </div>

      <p className="border-gl-border text-gl-text-muted border-t pt-2.5 text-[12px] leading-[1.55] italic">
        Refactored auth into a single guard. Tests dropped by half once responsibilities were
        separated.
        <span
          className="animate-cursor-blink bg-gl-primary ml-0.5 inline-block h-[11px] w-px translate-y-[1px]"
          aria-hidden="true"
        />
      </p>

      <div className="border-gl-border text-gl-primary flex items-center gap-1.5 border-t pt-2.5 text-[11px] font-medium">
        <span className="bg-gl-primary-soft inline-flex size-3.5 items-center justify-center rounded-full">
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
    <div className="border-gl-border flex flex-col gap-3 border-y py-4">
      <div className="divide-gl-border grid grid-cols-3 divide-x text-center">
        {(
          [
            { label: 'entries', value: '147', color: 'text-gl-primary' },
            { label: 'streak', value: '9d', color: 'text-gl-warning' },
            { label: 'avg score', value: '7.4', color: 'text-gl-learn' },
          ] as const
        ).map(({ label, value, color }) => (
          <div key={label} className="px-2">
            <p className={`font-mono text-[20px] leading-none font-bold tabular-nums ${color}`}>
              {value}
            </p>
            <p className="text-gl-text-faint mt-1 text-[9px]">{label}</p>
          </div>
        ))}
      </div>

      <div className="border-gl-border border-t pt-3">
        <div className="flex items-end gap-[3px]" style={{ height: 40 }}>
          {CHART_BARS.map((h, i) => (
            <div
              key={i}
              className="bg-gl-primary flex-1 rounded-t-[2px]"
              style={{
                height: `${(h / max) * 100}%`,
                opacity: 0.3 + (i / CHART_BARS.length) * 0.7,
              }}
            />
          ))}
        </div>
        <p className="text-gl-text-faint mt-1.5 flex items-center gap-1 text-[10px]">
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
    n: '01',
    icon: IconFolder,
    iconBg: 'bg-gl-primary-soft',
    iconColor: 'text-gl-primary',
    title: 'Set up your categories.',
    body: 'Define the areas you are tracking: your stack, your learning topics, your goals. Takes two minutes.',
    Preview: StepPreviewCategories,
  },
  {
    n: '02',
    icon: IconPen,
    iconBg: 'bg-gl-warning-soft',
    iconColor: 'text-gl-warning',
    title: 'Log something every day.',
    body: 'Takes less than a minute. A sentence, a bullet list, or a full reflection, whatever feels right.',
    Preview: StepPreviewLog,
  },
  {
    n: '03',
    icon: IconChart,
    iconBg: 'bg-gl-learn-bg',
    iconColor: 'text-gl-learn',
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
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveCard(idx);
          }
        });
      },
      { root: container, threshold: 0.6 },
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how" className="py-12 sm:py-16 lg:pt-16 lg:pb-12">
      <FadeIn>
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <h2 className="text-gl-text text-[36px] leading-[1.08] font-bold tracking-[-0.025em] text-balance sm:text-[44px] sm:tracking-[-0.028em]">
            Set up and start <span className="text-gl-primary">growing</span>.
          </h2>
        </div>
      </FadeIn>

      <FadeIn delay={130}>
        <div className="relative">
          <div
            ref={scrollRef}
            className="no-scrollbar relative flex snap-x snap-mandatory gap-4 overflow-x-auto sm:grid sm:snap-none sm:grid-cols-3 sm:gap-5 sm:overflow-visible"
          >
            {/* Connector line — desktop only, positioned at icon badge centre */}
            <div
              className="pointer-events-none absolute top-[44px] right-[16.66%] left-[16.66%] hidden h-px sm:block"
              style={{
                background: `linear-gradient(to right, transparent, var(--gl-border) 12%, var(--gl-border) 88%, transparent)`,
              }}
              aria-hidden="true"
            />

            {STEPS.map(({ n, icon: Icon, iconBg, iconColor, title, body, Preview }, i) => (
              <div
                key={n}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="border-gl-border bg-gl-surface shadow-gl hover:shadow-gl-lg relative z-10 flex w-[82%] min-w-[82%] flex-shrink-0 snap-start flex-col gap-5 rounded-2xl border p-6 transition-all duration-[150ms] hover:-translate-y-0.5 sm:w-auto sm:min-w-0"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex size-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="text-gl-border font-mono text-[28px] font-bold tabular-nums">
                    {n}
                  </span>
                </div>

                <Preview />

                <div>
                  <h3 className="text-gl-text mb-2 text-[18px] leading-[1.25] font-bold tracking-[-0.018em]">
                    {title}
                  </h3>
                  <p className="text-gl-text-muted text-[14px] leading-[1.65]">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right fade — signals more cards on mobile */}
          <div
            className="from-gl-bg pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent sm:hidden"
            aria-hidden="true"
          />
        </div>

        {/* Scroll dots — mobile only */}
        <div
          className="mt-5 flex justify-center gap-2 sm:hidden"
          role="tablist"
          aria-label="Step cards"
        >
          {STEPS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={activeCard === i}
              aria-label={`Step ${i + 1} of ${STEPS.length}`}
              onClick={() =>
                cardRefs.current[i]?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                  inline: 'start',
                })
              }
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeCard === i ? 'bg-gl-primary w-5' : 'bg-gl-border hover:bg-gl-text-faint w-1.5'
              }`}
            />
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
