'use client';

import { useState, useEffect } from 'react';
import { TypeBadge } from '@/components/common/type-badge';
import { IconCheck } from '@/components/common/icons';
import { useTypewriter } from '@/hooks/use-hero-cycle';

interface HeroEntry {
  dayNum: string;
  month: string;
  type: 'Work' | 'Learning';
  catName: string;
  catSub: string;
  swatchColor: string;
  score: number;
  title: string;
  body: string;
}

type Phase = 'typing' | 'reading' | 'fading';

const ENTRIES: HeroEntry[] = [
  {
    dayNum: '14',
    month: 'MAY',
    type: 'Work',
    catName: 'Backend',
    catSub: 'NestJS',
    swatchColor: '#69B598',
    score: 8,
    title: 'Refactored auth into a single guard.',
    body: 'Pulled the refresh-token rotation out of the login handler. Tests dropped by half once the responsibilities were separated.',
  },
  {
    dayNum: '13',
    month: 'MAY',
    type: 'Learning',
    catName: 'Reading',
    catSub: 'DDIA',
    swatchColor: '#B87DA2',
    score: 7,
    title: 'Chapter 4: replication patterns.',
    body: 'Conflict resolution finally clicked. Drew the quorum diagram from scratch to test my understanding, then wrote it up in Notion.',
  },
  {
    dayNum: '12',
    month: 'MAY',
    type: 'Work',
    catName: 'Side Project',
    catSub: 'CSV import',
    swatchColor: '#C4A05E',
    score: 9,
    title: 'Shipped the CSV import flow.',
    body: 'Row-level error highlighting lets users fix data inline and re-import without losing their place. Saved around 20 minutes per run.',
  },
];

// Timing constants — tweak here to adjust the feel globally
const CHAR_DELAY_MS = 24; // ms per typed character
const READ_PAUSE_MS = 3500; // ms to hold after typing finishes
const FADE_MS = 600; // ms for fade-out before swapping entry (must match CSS duration)

export function HeroEntryCard() {
  const [entryIndex, setEntryIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');

  const entry = ENTRIES[entryIndex];

  // The typewriter receives the current entry body. When entry changes (during the
  // typing → fading → typing transition), the hook resets and retypes the new body.
  const typedBody = useTypewriter(entry.body, CHAR_DELAY_MS);

  // Phase: typing → reading (after the body finishes typing)
  useEffect(() => {
    if (phase !== 'typing') return;
    // Wait just long enough for every character to be typed before switching phase
    const duration = entry.body.length * CHAR_DELAY_MS + 80;
    const timer = setTimeout(() => setPhase('reading'), duration);
    return () => clearTimeout(timer);
  }, [phase, entry.body]);

  // Phase: reading → fading (user has had time to read)
  useEffect(() => {
    if (phase !== 'reading') return;
    const timer = setTimeout(() => setPhase('fading'), READ_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase: fading → typing (advance to the next entry after the fade-out completes)
  useEffect(() => {
    if (phase !== 'fading') return;
    const timer = setTimeout(() => {
      setEntryIndex((i) => (i + 1) % ENTRIES.length);
      setPhase('typing');
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const contentVisible = phase !== 'fading';

  return (
    <div className="border-gl-border bg-gl-surface shadow-gl-lg hover:shadow-gl-lg relative flex h-full min-h-[280px] flex-col rounded-2xl border p-7 transition-all duration-[150ms] hover:-translate-y-0.5">
      {/* All entry content fades as a unit when switching entries */}
      <div
        className="flex flex-1 flex-col gap-3.5 transition-opacity"
        style={{ opacity: contentVisible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      >
        {/* Date + score */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-gl-text-faint font-mono text-[11px] font-semibold tracking-[0.10em] whitespace-nowrap uppercase">
            {entry.dayNum} {entry.month} · Today
          </span>
          <span className="bg-gl-primary-soft text-gl-primary inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[12px] font-semibold whitespace-nowrap tabular-nums">
            <span className="text-gl-primary/60 font-normal">score</span> {entry.score} / 10
          </span>
        </div>

        {/* Type badge + category chip */}
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={entry.type} />
          <span className="border-gl-border bg-gl-surface-2 text-gl-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium whitespace-nowrap">
            <span
              className="size-[7px] shrink-0 rounded-full"
              style={{ background: entry.swatchColor }}
              aria-hidden="true"
            />
            {entry.catName}
            <span className="text-gl-text-faint mx-0.5">/</span>
            <span className="text-gl-text-muted">{entry.catSub}</span>
          </span>
        </div>

        {/* Title — min-h reserves 2 lines so short/long titles don't shift card height */}
        <h3 className="text-gl-text mt-0.5 min-h-[58px] text-[22px] leading-[1.32] font-bold tracking-[-0.018em] text-balance">
          {entry.title}
        </h3>

        {/* Body with typewriter — min-height prevents layout shift as text types */}
        <p className="text-gl-text-muted min-h-[72px] text-[14.5px] leading-[1.65] italic">
          {typedBody}
          <span
            className="bg-gl-primary animate-cursor-blink ml-0.5 inline-block h-[13px] w-px translate-y-[2px]"
            aria-hidden="true"
          />
        </p>
      </div>

      {/* Footer — stays visible while the entry content fades in and out */}
      <div className="border-gl-border mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-gl-primary inline-flex items-center gap-1.5 text-[11.5px] font-medium">
          <span className="bg-gl-primary-soft inline-flex size-[14px] items-center justify-center rounded-full">
            <IconCheck size={9} />
          </span>
          Saved · just now
        </span>
        <kbd className="text-gl-text-faint font-mono text-[11px] font-medium">↵ enter</kbd>
      </div>
    </div>
  );
}
