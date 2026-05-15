'use client';

import { useState, useEffect, useRef } from 'react';
import { TypeBadge } from '@/components/common/type-badge';
import { ScorePill } from '@/components/common/score-pill';
import { IconDots } from '@/components/common/icons';
import type { MockEntry } from '@/data/dashboard-mock';

interface EntryRowProps {
  entry: MockEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLast: boolean;
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
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="Entry options"
        className={`inline-flex size-7 items-center justify-center rounded-[7px] text-gl-text-muted transition-colors ${
          open ? 'bg-gl-bg-subtle' : 'hover:bg-gl-bg-subtle'
        }`}
      >
        <IconDots size={16} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-[9px] border border-gl-border bg-gl-surface p-1 shadow-gl"
        >
          {(['Edit', 'Delete'] as const).map((action) => (
            <button
              key={action}
              className={`block w-full rounded-md px-2.5 py-[7px] text-left text-[13px] font-medium transition-colors hover:bg-gl-bg-subtle ${
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

  return (
    <div className={`group cursor-pointer transition-colors hover:bg-gl-surface-2 ${borderClass}`}>

      {/* ── Mobile card layout ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-4 py-3.5 sm:hidden" onClick={onToggleExpand}>
        {/* Top row: type badge + score + menu */}
        <div className="flex items-center justify-between gap-2">
          <TypeBadge type={entry.type} />
          <div className="flex items-center gap-2">
            <ScorePill score={entry.score} />
            <EntryMenu />
          </div>
        </div>

        {/* Category breadcrumb */}
        <div className="flex items-center gap-1.5">
          <span
            className="size-[7px] shrink-0 rounded-full"
            style={{ background: entry.swatchColor }}
            aria-hidden="true"
          />
          <span className="text-[13px] font-semibold leading-none text-gl-text">
            {entry.categoryName}
          </span>
          <span className="text-[11px] leading-none text-gl-text-faint">/</span>
          <span className="truncate text-[12px] leading-none text-gl-text-muted">
            {entry.subcategoryName}
          </span>
        </div>

        {/* Entry text — 2 lines preview, full on expand */}
        <p
          className={`text-[13px] italic leading-[1.5] text-gl-text-muted ${
            isExpanded ? '' : 'line-clamp-2'
          }`}
        >
          {entry.text}
        </p>
      </div>

      {/* ── Desktop row layout ─────────────────────────────────────────── */}
      <div
        className="hidden sm:flex items-center gap-4 px-[22px] py-3.5"
        onClick={onToggleExpand}
      >
        {/* Date */}
        <div className="w-11 shrink-0 text-center">
          <div className="text-[17px] font-bold leading-none tracking-[-0.015em] text-gl-text">
            {entry.day}
          </div>
          <div className="mt-[3px] font-mono text-[10px] uppercase tracking-[0.06em] text-gl-text-faint">
            {entry.month}
          </div>
        </div>

        {/* Type badge */}
        <div className="w-[76px] shrink-0">
          <TypeBadge type={entry.type} />
        </div>

        {/* Category + body */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span
              className="size-[7px] shrink-0 rounded-full"
              style={{ background: entry.swatchColor }}
              aria-hidden="true"
            />
            <span className="text-[13px] font-semibold leading-none text-gl-text">
              {entry.categoryName}
            </span>
            <span className="text-[11px] leading-none text-gl-text-faint">/</span>
            <span className="truncate text-[12px] leading-none text-gl-text-muted">
              {entry.subcategoryName}
            </span>
          </div>
          <p
            className={`text-[13px] italic leading-[1.5] text-gl-text-muted ${
              isExpanded ? '' : 'truncate'
            }`}
          >
            {entry.text}
          </p>
        </div>

        {/* Score */}
        <div className="shrink-0">
          <ScorePill score={entry.score} />
        </div>

        {/* Menu */}
        <EntryMenu />
      </div>
    </div>
  );
}
