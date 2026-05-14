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
    dayNum: '14', month: 'MAY', type: 'Work',
    catName: 'Backend', catSub: 'NestJS', swatchColor: '#6FC8A0',
    score: 8,
    title: 'Refactored auth into a single guard.',
    body: 'Pulled the refresh-token rotation out of the login handler. Tests dropped by half once the responsibilities were separated.',
  },
  {
    dayNum: '13', month: 'MAY', type: 'Learning',
    catName: 'Reading', catSub: 'DDIA', swatchColor: '#BFA8E5',
    score: 7,
    title: 'Chapter 4 — replication patterns.',
    body: 'Conflict resolution finally clicked. Drew the quorum diagram from scratch to test my understanding, then wrote it up in Notion.',
  },
  {
    dayNum: '12', month: 'MAY', type: 'Work',
    catName: 'Side Project', catSub: 'CSV import', swatchColor: '#E0AE52',
    score: 9,
    title: 'Shipped the CSV import flow.',
    body: 'Row-level error highlighting lets users fix data inline and re-import without losing their place. Saved around 20 minutes per run.',
  },
];

// Timing constants — tweak here to adjust the feel globally
const CHAR_DELAY_MS = 16;   // ms per typed character
const READ_PAUSE_MS = 2400;  // ms to hold after typing finishes
const FADE_MS = 360;         // ms for fade-out before swapping entry (must match CSS duration)

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
      setEntryIndex(i => (i + 1) % ENTRIES.length);
      setPhase('typing');
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const contentVisible = phase !== 'fading';

  return (
    <div className="relative flex h-full min-h-[280px] flex-col rounded-2xl border border-gl-border bg-gl-surface p-7 shadow-gl-lg transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg">

      {/* All entry content fades as a unit when switching entries */}
      <div
        className="flex flex-1 flex-col gap-3.5 transition-opacity"
        style={{ opacity: contentVisible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      >
        {/* Date + score */}
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.10em] text-gl-text-faint whitespace-nowrap">
            {entry.dayNum} {entry.month} · Today
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gl-primary-soft px-2.5 py-1 font-mono text-[12px] font-semibold tabular-nums text-gl-primary whitespace-nowrap">
            <span className="font-normal text-gl-primary/60">score</span> {entry.score} / 10
          </span>
        </div>

        {/* Type badge + category chip */}
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={entry.type} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gl-border bg-gl-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-gl-text whitespace-nowrap">
            <span
              className="size-[7px] shrink-0 rounded-full"
              style={{ background: entry.swatchColor }}
              aria-hidden="true"
            />
            {entry.catName}
            <span className="mx-0.5 text-gl-text-faint">/</span>
            <span className="text-gl-text-muted">{entry.catSub}</span>
          </span>
        </div>

        {/* Title — appears instantly with fade-in of the content block */}
        <h3 className="mt-0.5 text-[22px] font-bold leading-[1.32] tracking-[-0.018em] text-gl-text text-balance">
          {entry.title}
        </h3>

        {/* Body with typewriter — min-height prevents layout shift as text types */}
        <p className="min-h-[72px] text-[14.5px] italic leading-[1.65] text-gl-text-muted">
          {typedBody}
          <span
            className="ml-0.5 inline-block h-[13px] w-px translate-y-[2px] bg-gl-primary animate-cursor-blink"
            aria-hidden="true"
          />
        </p>
      </div>

      {/* Footer — stays visible while the entry content fades in and out */}
      <div className="mt-4 flex items-center justify-between border-t border-gl-border pt-3">
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
