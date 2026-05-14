'use client';

import { useEffect, useState } from 'react';
import { IconClose, IconChevronDown } from '@/components/common/icons';
import type { MockCategory } from '@/data/dashboard-mock';

interface AddEntrySheetProps {
  open: boolean;
  onClose: () => void;
  categories: MockCategory[];
}

export function AddEntrySheet({ open, onClose, categories }: AddEntrySheetProps){
  const [type, setType] = useState<'Work' | 'Learning'>('Work');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [score, setScore] = useState(7);

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? categories[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-gl-bg/45 transition-opacity duration-[250ms] ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="New entry"
        className={`fixed inset-y-0 right-0 z-60 flex w-[480px] max-w-full flex-col border-l border-gl-border bg-gl-surface shadow-gl-lg transition-transform duration-[280ms] ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gl-border px-6 py-5">
          <div>
            <h2 className="text-[18px] font-bold leading-snug tracking-[-0.018em] text-gl-text">New entry</h2>
            <p className="mt-1 text-[12.5px] text-gl-text-muted">Thursday, 15 May</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-8 items-center justify-center rounded-lg bg-gl-surface-2 text-gl-text-muted transition-colors hover:text-gl-text"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto p-6">
          {/* Type */}
          <div>
            <label className="mb-2 block text-[12.5px] font-semibold text-gl-text">Type</label>
            <div className="inline-flex rounded-[10px] border border-gl-border bg-gl-bg-subtle p-1">
              {(['Work', 'Learning'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setType(opt)}
                  className={`rounded-[7px] px-4 py-2 text-[13px] font-medium transition-colors duration-[120ms] ${
                    type === opt
                      ? 'border border-gl-border bg-gl-surface text-gl-text shadow-gl'
                      : 'border border-transparent text-gl-text-muted'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="sheet-category" className="mb-2 block text-[12.5px] font-semibold text-gl-text">Category</label>
            <div className="flex items-center gap-2.5 rounded-[10px] border border-gl-border-input bg-gl-surface px-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: selectedCategory?.swatchColor }}
                aria-hidden="true"
              />
              <select
                id="sheet-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-[42px] flex-1 appearance-none bg-transparent text-[14px] text-gl-text outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: 'var(--gl-surface)' }}>
                    {c.name}
                  </option>
                ))}
              </select>
              <IconChevronDown size={12} className="shrink-0 text-gl-text-muted" />
            </div>

            {selectedCategory && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {selectedCategory.subcategories.map((sub) => (
                  <span
                    key={sub}
                    className="rounded-full border border-gl-border bg-gl-bg-subtle px-2.5 py-1 text-[11.5px] text-gl-text-muted"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Text */}
          <div>
            <label htmlFor="sheet-text" className="mb-2 block text-[12.5px] font-semibold text-gl-text">What did you do?</label>
            <textarea
              id="sheet-text"
              rows={5}
              placeholder="One line, a list, or a full reflection."
              className="w-full resize-y rounded-[10px] border border-gl-border-input bg-gl-surface px-3.5 py-3 text-[14px] leading-relaxed text-gl-text placeholder:text-gl-text-faint outline-none focus-visible:border-gl-primary"
            />
          </div>

          {/* Score */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="sheet-score" className="text-[12.5px] font-semibold text-gl-text">Productivity score</label>
              <span className="font-mono text-[12px] text-gl-text-muted">{score} / 10</span>
            </div>
            <input
              id="sheet-score"
              type="range"
              min="1"
              max="10"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full accent-gl-primary"
            />
            <div className="mt-1 flex justify-between font-mono text-[10.5px] text-gl-text-faint">
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-gl-border px-6 py-4">
          <button onClick={onClose} className="rounded-[10px] px-4 py-[11px] text-[13.5px] font-semibold text-gl-text-muted hover:text-gl-text">
            Cancel
          </button>
          <button onClick={onClose} className="rounded-[10px] bg-gl-primary-soft px-[18px] py-[11px] text-[13.5px] font-semibold text-gl-primary hover:bg-gl-primary-soft/80">
            Save entry
          </button>
        </div>
      </aside>
    </>
  );
}
