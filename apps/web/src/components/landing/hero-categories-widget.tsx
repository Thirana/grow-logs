'use client';

import { useState, useEffect, useRef } from 'react';

interface HeroCategoriesWidgetProps {
  className?: string;
}

const CATEGORY_POOL = [
  { name: 'Backend',       count: 38, swatchColor: '#6FC8A0' },
  { name: 'System Design', count: 24, swatchColor: '#7C8FE0' },
  { name: 'Reading',       count: 22, swatchColor: '#BFA8E5' },
  { name: 'Side Project',  count: 19, swatchColor: '#E0AE52' },
  { name: 'Soft Skills',   count: 15, swatchColor: '#E8866F' },
  { name: 'Open Source',   count: 11, swatchColor: '#5FB8CD' },
] as const;

const SLOT_COUNT = 4; // number of pills always visible
const SWAP_INTERVAL_MS = 4000;
const FADE_MS = 450;

export function HeroCategoriesWidget({ className = '' }: HeroCategoriesWidgetProps) {
  // Each slot holds an index into CATEGORY_POOL. Layout stays stable (always SLOT_COUNT pills).
  const [slots, setSlots] = useState<number[]>(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => i),
  );
  // Which slot index (0 … SLOT_COUNT-1) is currently fading out
  const [fadingSlot, setFadingSlot] = useState<number | null>(null);

  // useRef so the interval always reads the latest slots without being in its own dep array
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = slotsRef.current;
      const hidden = CATEGORY_POOL
        .map((_, i) => i)
        .filter(i => !current.includes(i));

      if (hidden.length === 0) return;

      const slotToChange = Math.floor(Math.random() * SLOT_COUNT);
      const newCatIndex = hidden[Math.floor(Math.random() * hidden.length)];

      // Start fade-out for the chosen slot
      setFadingSlot(slotToChange);

      // After the fade-out completes, swap the category and fade back in
      fadeTimerRef.current = setTimeout(() => {
        setSlots(prev => {
          const next = [...prev];
          next[slotToChange] = newCatIndex;
          return next;
        });
        setFadingSlot(null);
      }, FADE_MS);
    }, SWAP_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []); // intentionally empty — slotsRef handles fresh reads

  return (
    <div
      className={`rounded-xl border border-gl-border bg-gl-surface p-5 shadow-gl transition-all duration-[150ms] hover:-translate-y-0.5 hover:shadow-gl-lg ${className}`}
    >
      <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gl-text-faint">
        Top categories
      </p>

      <div className="flex flex-wrap gap-2">
        {slots.map((catIndex, slotIndex) => {
          const cat = CATEGORY_POOL[catIndex];
          const isFading = fadingSlot === slotIndex;

          return (
            // key is the slot index, NOT the category — keeps the DOM element in place
            // so only opacity changes, not a full remount
            <span
              key={slotIndex}
              className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-gl-border bg-gl-surface-2 px-3 py-1.5 text-[12.5px] font-medium text-gl-text transition-all duration-[450ms] hover:-translate-y-0.5"
              style={{ opacity: isFading ? 0 : 1 }}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: cat.swatchColor }}
                aria-hidden="true"
              />
              {cat.name}
              <span className="ml-0.5 font-mono text-[10.5px] tabular-nums text-gl-text-faint">
                {cat.count}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
