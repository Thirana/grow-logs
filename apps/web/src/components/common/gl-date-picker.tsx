'use client';

// GL-styled calendar date picker — replaces native <input type="date">.
// Used by: components/dashboard/entry-sheet.tsx
import { type JSX, useEffect, useRef, useState } from 'react';

import { IconCalendar, IconChevronDown, IconArrow } from '@/components/common/icons';
import { cn } from '@/lib/utils';

interface GlDatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  max?: string;
  error?: boolean;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseYMD(s: string): { y: number; m: number; d: number } | null {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { y: parts[0], m: parts[1] - 1, d: parts[2] };
}

function formatDisplay(s: string): string {
  const p = parseYMD(s);
  if (!p) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(p.y, p.m, p.d));
}

export function GlDatePicker({ id, value, onChange, max, error }: GlDatePickerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  const maxParsed = max ? parseYMD(max) : null;
  const selectedParsed = parseYMD(value);

  const [viewYear, setViewYear] = useState(() => selectedParsed?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedParsed?.m ?? today.getMonth());

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function selectDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  }

  function isSelected(day: number): boolean {
    return (
      selectedParsed !== null &&
      selectedParsed.y === viewYear &&
      selectedParsed.m === viewMonth &&
      selectedParsed.d === day
    );
  }

  function isToday(day: number): boolean {
    return (
      today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
    );
  }

  function isDisabled(day: number): boolean {
    if (!maxParsed) return false;
    const cellDate = new Date(viewYear, viewMonth, day);
    const maxDate = new Date(maxParsed.y, maxParsed.m, maxParsed.d);
    return cellDate > maxDate;
  }

  const canGoNext =
    !maxParsed ||
    new Date(viewYear, viewMonth + 1, 1) <= new Date(maxParsed.y, maxParsed.m, maxParsed.d);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'border-gl-border-input bg-gl-surface',
          'flex h-[42px] w-full items-center gap-2.5 rounded-[10px] border px-3 transition-colors',
          open ? 'border-gl-primary' : '',
          error && 'border-gl-danger',
        )}
      >
        <IconCalendar size={14} className="text-gl-text-muted shrink-0" />
        <span
          className={cn(
            'flex-1 text-left text-[14px]',
            value ? 'text-gl-text' : 'text-gl-text-faint',
          )}
        >
          {value ? formatDisplay(value) : 'Pick a date'}
        </span>
        <IconChevronDown
          size={12}
          className={cn(
            'text-gl-text-muted shrink-0 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Calendar popup */}
      {open && (
        <div
          role="dialog"
          aria-label="Date picker"
          className={cn(
            'border-gl-border bg-gl-surface shadow-gl-lg',
            'absolute right-0 left-0 z-10 mt-1.5 rounded-[12px] border p-3.5',
          )}
        >
          {/* Month / year nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="text-gl-text-muted hover:bg-gl-surface-2 hover:text-gl-text flex size-7 items-center justify-center rounded-lg transition-colors"
            >
              <IconArrow size={12} className="rotate-180" />
            </button>
            <span className="text-gl-text text-[13px] font-semibold">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext}
              aria-label="Next month"
              className="text-gl-text-muted hover:bg-gl-surface-2 hover:text-gl-text flex size-7 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            >
              <IconArrow size={12} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="text-gl-text-faint py-1 text-[10.5px] font-semibold">
                {wd}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const sel = isSelected(day);
              const tod = isToday(day);
              const dis = isDisabled(day);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={dis}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'mx-auto flex size-7 items-center justify-center rounded-full text-[13px] transition-colors',
                    sel
                      ? 'bg-gl-primary text-gl-primary-ink font-semibold'
                      : tod
                        ? 'border-gl-primary text-gl-primary border font-semibold'
                        : dis
                          ? 'text-gl-text-faint cursor-not-allowed'
                          : 'text-gl-text hover:bg-gl-surface-2 cursor-pointer',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
