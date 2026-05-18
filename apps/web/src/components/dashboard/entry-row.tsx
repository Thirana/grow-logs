'use client';

import { useState, useEffect, useRef } from 'react';
import { TypeBadge } from '@/components/common/type-badge';
import { ScorePill } from '@/components/common/score-pill';
import { IconDots } from '@/components/common/icons';
import { getCategorySwatchVar } from '@/lib/utils';
import type { Entry } from '@grow-logs/types';

interface EntryRowProps {
  entry: Entry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLast: boolean;
}

function formatEntryDate(isoDate: string): { day: string; month: string } {
  const d = new Date(`${isoDate}T00:00:00`);
  return {
    day: String(d.getDate()),
    month: d.toLocaleString('en-US', { month: 'short' }),
  };
}

function EntryMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Entry options"
        className={`text-gl-text-muted inline-flex size-7 items-center justify-center rounded-[7px] transition-colors ${
          open ? 'bg-gl-bg-subtle' : 'hover:bg-gl-bg-subtle'
        }`}
      >
        <IconDots size={16} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="border-gl-border bg-gl-surface shadow-gl absolute top-full right-0 z-20 mt-1 min-w-[140px] rounded-[9px] border p-1"
        >
          {(['Edit', 'Delete'] as const).map((action) => (
            <button
              key={action}
              className={`hover:bg-gl-bg-subtle block w-full rounded-md px-2.5 py-[7px] text-left text-[13px] font-medium transition-colors ${
                action === 'Delete' ? 'text-gl-danger' : 'text-gl-text'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EntryRow({ entry, isExpanded, onToggleExpand, isLast }: EntryRowProps) {
  const borderClass = isLast ? '' : 'border-b border-gl-border';
  const swatch = getCategorySwatchVar(entry.categoryId);
  const { day, month } = formatEntryDate(entry.entryDate);

  return (
    <div className={`group hover:bg-gl-surface-2 cursor-pointer transition-colors ${borderClass}`}>
      {/* ── Mobile card layout ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-4 py-3.5 sm:hidden" onClick={onToggleExpand}>
        <div className="flex items-center justify-between gap-2">
          <TypeBadge type={entry.type} />
          <div className="flex items-center gap-2">
            {entry.score != null && <ScorePill score={entry.score} />}
            <EntryMenu />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="size-[7px] shrink-0 rounded-full"
            style={{ background: swatch }}
            aria-hidden="true"
          />
          <span className="text-gl-text text-[13px] leading-none font-semibold">
            {entry.categoryName}
          </span>
          {entry.subcategoryName && (
            <>
              <span className="text-gl-text-faint text-[11px] leading-none">/</span>
              <span className="text-gl-text-muted truncate text-[12px] leading-none">
                {entry.subcategoryName}
              </span>
            </>
          )}
        </div>

        <p
          className={`text-gl-text-muted text-[13px] leading-[1.5] italic ${
            isExpanded ? '' : 'line-clamp-2'
          }`}
        >
          {entry.text}
        </p>
      </div>

      {/* ── Desktop row layout ─────────────────────────────────────────── */}
      <div className="hidden items-center gap-4 px-[22px] py-3.5 sm:flex" onClick={onToggleExpand}>
        <div className="w-11 shrink-0 text-center">
          <div className="text-gl-text text-[17px] leading-none font-bold tracking-[-0.015em]">
            {day}
          </div>
          <div className="text-gl-text-faint mt-[3px] font-mono text-[10px] tracking-[0.06em] uppercase">
            {month}
          </div>
        </div>

        <div className="w-[76px] shrink-0">
          <TypeBadge type={entry.type} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span
              className="size-[7px] shrink-0 rounded-full"
              style={{ background: swatch }}
              aria-hidden="true"
            />
            <span className="text-gl-text text-[13px] leading-none font-semibold">
              {entry.categoryName}
            </span>
            {entry.subcategoryName && (
              <>
                <span className="text-gl-text-faint text-[11px] leading-none">/</span>
                <span className="text-gl-text-muted truncate text-[12px] leading-none">
                  {entry.subcategoryName}
                </span>
              </>
            )}
          </div>
          <p
            className={`text-gl-text-muted text-[13px] leading-[1.5] italic ${
              isExpanded ? '' : 'truncate'
            }`}
          >
            {entry.text}
          </p>
        </div>

        <div className="shrink-0">{entry.score != null && <ScorePill score={entry.score} />}</div>

        <EntryMenu />
      </div>
    </div>
  );
}
