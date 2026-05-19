'use client';

// Reusable GL-styled select dropdown — replaces native <select> with design-token styling.
// Used by: components/dashboard/entry-sheet.tsx
import { type JSX, useEffect, useRef, useState } from 'react';

import { IconCheck, IconChevronDown } from '@/components/common/icons';
import { cn } from '@/lib/utils';

export interface GlSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface GlSelectProps {
  id?: string;
  options: GlSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  leading?: React.ReactNode;
  error?: boolean;
}

export function GlSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  leading,
  error,
}: GlSelectProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'border-gl-border-input bg-gl-surface text-gl-text',
          'flex h-[42px] w-full items-center gap-2.5 rounded-[10px] border px-3 transition-colors',
          open && 'border-gl-primary',
          error && 'border-gl-danger',
        )}
      >
        {leading}
        <span className="flex-1 truncate text-left text-[14px]">
          {selected ? selected.label : <span className="text-gl-text-faint">{placeholder}</span>}
        </span>
        <IconChevronDown
          size={12}
          className={cn(
            'text-gl-text-muted shrink-0 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            'border-gl-border bg-gl-surface shadow-gl-lg',
            'absolute right-0 left-0 z-10 mt-1.5 max-h-52 overflow-y-auto rounded-[10px] border py-1',
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled}
                onClick={() => {
                  if (!opt.disabled) {
                    onChange(opt.value);
                    setOpen(false);
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-[14px]',
                  isSelected
                    ? 'bg-gl-primary-soft/30 text-gl-primary'
                    : opt.disabled
                      ? 'text-gl-text-faint cursor-not-allowed'
                      : 'text-gl-text hover:bg-gl-surface-2',
                )}
              >
                <span className="flex-1">{opt.label}</span>
                {isSelected && <IconCheck size={12} className="text-gl-primary shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
