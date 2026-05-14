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

export function EntryRow({ entry, isExpanded, onToggleExpand, isLast }: EntryRowProps){
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  return (
    <div
      onClick={onToggleExpand}
      className={`group grid cursor-pointer items-center gap-4 px-[22px] py-4 transition-colors hover:bg-gl-surface-2 ${isLast ? '' : 'border-b border-gl-border'}`}
      style={{ gridTemplateColumns: '56px 88px 1fr 76px 32px' }}
    >
      {/* Date */}
      <div>
        <div className="text-[18px] font-bold leading-none tracking-[-0.015em] text-gl-text">
          {entry.day}
        </div>
        <div className="mt-1 font-mono text-[11px] uppercase text-gl-text-faint">{entry.month}</div>
      </div>

      {/* Type badge */}
      <TypeBadge type={entry.type} />

      {/* Category + text */}
      <div className="min-w-0">
        <div className="mb-1 flex items-baseline gap-1.5">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-gl-text whitespace-nowrap">
            <span
              className="size-[7px] shrink-0 rounded-full"
              style={{ background: entry.swatchColor }}
              aria-hidden="true"
            />
            {entry.categoryName}
          </span>
          <span className="text-[12px] text-gl-text-faint">/</span>
          <span className="text-[12px] text-gl-text-muted whitespace-nowrap">{entry.subcategoryName}</span>
        </div>
        <p
          className={`text-[13.5px] italic leading-relaxed text-gl-text-muted ${
            isExpanded ? '' : 'overflow-hidden text-ellipsis whitespace-nowrap'
          }`}
        >
          {entry.text}
        </p>
      </div>

      {/* Score */}
      <div className="justify-self-end">
        <ScorePill score={entry.score} />
      </div>

      {/* Context menu */}
      <div className="relative justify-self-end" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          aria-label="Entry options"
          className={`inline-flex size-7 items-center justify-center rounded-[7px] text-gl-text-muted transition-colors ${
            menuOpen ? 'bg-gl-bg-subtle' : 'hover:bg-gl-bg-subtle'
          }`}
        >
          <IconDots size={16} />
        </button>

        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-[9px] border border-gl-border-strong bg-gl-surface p-1 shadow-gl"
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
    </div>
  );
}
