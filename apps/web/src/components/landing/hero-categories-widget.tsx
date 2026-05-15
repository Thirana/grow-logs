'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';

interface HeroCategoriesWidgetProps {
  className?: string;
}

const CATEGORY_POOL = [
  { name: 'Backend', count: 38, swatchColor: '#69B598' },
  { name: 'System Design', count: 24, swatchColor: '#8285BA' },
  { name: 'Reading', count: 22, swatchColor: '#B87DA2' },
  { name: 'Side Project', count: 19, swatchColor: '#C4A05E' },
  { name: 'Soft Skills', count: 15, swatchColor: '#62AEBF' },
  { name: 'Open Source', count: 11, swatchColor: '#B87060' },
  { name: 'Architecture', count: 9, swatchColor: '#8285BA' },
  { name: 'DevOps', count: 7, swatchColor: '#69B598' },
  { name: 'Testing', count: 5, swatchColor: '#C4A05E' },
] as const;

const SLOT_COUNT = 6;
const SWAP_INTERVAL_MS = 4000;
const FADE_MS = 450;

export function HeroCategoriesWidget({ className = '' }: HeroCategoriesWidgetProps) {
  const [slots, setSlots] = useState<number[]>(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => i),
  );
  const [fadingSlot, setFadingSlot] = useState<number | null>(null);

  const slotsRef = useRef(slots);
  useLayoutEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = slotsRef.current;
      const hidden = CATEGORY_POOL.map((_, i) => i).filter((i) => !current.includes(i));

      if (hidden.length === 0) return;

      const slotToChange = Math.floor(Math.random() * SLOT_COUNT);
      const newCatIndex = hidden[Math.floor(Math.random() * hidden.length)];

      setFadingSlot(slotToChange);

      fadeTimerRef.current = setTimeout(() => {
        setSlots((prev) => {
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
  }, []);

  return (
    <div
      className={`border-gl-border bg-gl-surface shadow-gl hover:shadow-gl-lg rounded-xl border p-5 transition-all duration-[150ms] hover:-translate-y-0.5 ${className}`}
    >
      <p className="text-gl-text-faint mb-3.5 text-[10px] font-bold tracking-[0.12em] uppercase">
        Top categories
      </p>

      {/* Fixed 2-col (mobile) / 3-col (sm+) grid — no flex-wrap reflow, height is always stable */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((catIndex, slotIndex) => {
          const cat = CATEGORY_POOL[catIndex];
          const isFading = fadingSlot === slotIndex;

          return (
            <span
              key={slotIndex}
              className={`border-gl-border bg-gl-surface-2 cursor-default items-center justify-between gap-1.5 rounded-xl border px-3 py-1.5 transition-all duration-[450ms] hover:-translate-y-0.5 ${slotIndex >= 4 ? 'hidden sm:flex' : 'flex'}`}
              style={{ opacity: isFading ? 0 : 1 }}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: cat.swatchColor }}
                  aria-hidden="true"
                />
                <span className="text-gl-text truncate text-[12.5px] font-medium">{cat.name}</span>
              </span>
              <span className="text-gl-text-faint ml-1 shrink-0 font-mono text-[10.5px] tabular-nums">
                {cat.count}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
