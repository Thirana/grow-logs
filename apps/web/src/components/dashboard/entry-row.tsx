'use client';

// Single entry row with expand-to-read, edit shortcut, and delete confirmation.
// Used by: components/dashboard/recent-entries.tsx
import { useState, useEffect, useRef } from 'react';
import { TypeBadge } from '@/components/common/type-badge';
import { ScorePill } from '@/components/common/score-pill';
import { IconDots, IconPen, IconTrash } from '@/components/common/icons';
import { DeleteEntryDialog } from './delete-entry-dialog';
import type { Entry } from '@grow-logs/types';

interface EntryRowProps {
  entry: Entry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLast: boolean;
  onEdit?: (entry: Entry) => void;
}

function formatEntryDate(isoDate: string): { day: string; month: string } {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  return {
    day: String(d.getDate()),
    month: d.toLocaleString('en-US', { month: 'short' }),
  };
}

interface EntryMenuProps {
  onEdit: () => void;
  onDeleteClick: () => void;
}

function EntryMenu({ onEdit, onDeleteClick }: EntryMenuProps) {
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
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="hover:bg-gl-bg-subtle text-gl-text flex w-full items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-[13px] font-medium transition-colors"
          >
            <IconPen size={13} />
            Edit
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDeleteClick();
            }}
            className="hover:bg-gl-bg-subtle text-gl-danger flex w-full items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-[13px] font-medium transition-colors"
          >
            <IconTrash size={13} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function EntryRow({ entry, isExpanded, onToggleExpand, isLast, onEdit }: EntryRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const borderClass = isLast ? '' : 'border-b border-gl-border';
  const swatch = entry.category.color;
  const { day, month } = formatEntryDate(entry.entryDate);

  const menu = (
    <EntryMenu onEdit={() => onEdit?.(entry)} onDeleteClick={() => setDeleteOpen(true)} />
  );

  return (
    <>
      <div
        className={`group hover:bg-gl-surface-2 cursor-pointer transition-colors ${borderClass}`}
      >
        {/* ── Mobile card layout ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 px-4 py-3.5 sm:hidden" onClick={onToggleExpand}>
          <div className="flex items-center justify-between gap-2">
            <TypeBadge type={entry.type} />
            <div className="flex items-center gap-2">
              {entry.productivityScore != null && <ScorePill score={entry.productivityScore} />}
              {menu}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="size-[7px] shrink-0 rounded-full"
              style={{ background: swatch }}
              aria-hidden="true"
            />
            <span className="text-gl-text text-[13px] leading-none font-semibold">
              {entry.category.name}
            </span>
            {entry.subcategory?.name && (
              <>
                <span className="text-gl-text-faint text-[11px] leading-none">/</span>
                <span className="text-gl-text-muted truncate text-[12px] leading-none">
                  {entry.subcategory?.name}
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
        <div
          className="hidden items-center gap-4 px-[22px] py-3.5 sm:flex"
          onClick={onToggleExpand}
        >
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
                {entry.category.name}
              </span>
              {entry.subcategory?.name && (
                <>
                  <span className="text-gl-text-faint text-[11px] leading-none">/</span>
                  <span className="text-gl-text-muted truncate text-[12px] leading-none">
                    {entry.subcategory?.name}
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

          <div className="shrink-0">
            {entry.productivityScore != null && <ScorePill score={entry.productivityScore} />}
          </div>

          {menu}
        </div>
      </div>

      <DeleteEntryDialog
        open={deleteOpen}
        entryId={entry.id}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
