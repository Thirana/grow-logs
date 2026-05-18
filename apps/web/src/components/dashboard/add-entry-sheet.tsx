'use client';

import { useEffect, useState } from 'react';

import { IconClose, IconChevronDown } from '@/components/common/icons';
import { useCategories } from '@/hooks/use-categories';
import { getCategorySwatchVar } from '@/lib/utils';

interface AddEntrySheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddEntrySheet({ open, onClose }: AddEntrySheetProps) {
  const { data: categories = [] } = useCategories();
  const active = categories.filter((c) => !c.isCompleted);

  const [type, setType] = useState<'Work' | 'Learning'>('Work');
  const [categoryId, setCategoryId] = useState('');
  const [score, setScore] = useState(7);

  // Derive effective ID at render time — avoids an effect-based setState cascade.
  const effectiveCategoryId = categoryId || active[0]?.id || '';
  const selectedCategory = active.find((c) => c.id === effectiveCategoryId) ?? active[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`bg-gl-bg/45 fixed inset-0 z-50 transition-opacity duration-[250ms] ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="New entry"
        className={`border-gl-border bg-gl-surface shadow-gl-lg fixed inset-y-0 right-0 z-60 flex w-[480px] max-w-full flex-col border-l transition-transform duration-[280ms] ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="border-gl-border flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-gl-text text-[18px] leading-snug font-bold tracking-[-0.018em]">
              New entry
            </h2>
            <p className="text-gl-text-muted mt-1 text-[12.5px]">
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date())}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="bg-gl-surface-2 text-gl-text-muted hover:text-gl-text inline-flex size-8 items-center justify-center rounded-lg transition-colors"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto p-6">
          {/* Type */}
          <div>
            <label className="text-gl-text mb-2 block text-[12.5px] font-semibold">Type</label>
            <div className="border-gl-border bg-gl-bg-subtle inline-flex rounded-[10px] border p-1">
              {(['Work', 'Learning'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setType(opt)}
                  className={`rounded-[7px] px-4 py-2 text-[13px] font-medium transition-colors duration-[120ms] ${
                    type === opt
                      ? 'border-gl-border bg-gl-surface text-gl-text shadow-gl border'
                      : 'text-gl-text-muted border border-transparent'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="sheet-category"
              className="text-gl-text mb-2 block text-[12.5px] font-semibold"
            >
              Category
            </label>
            <div className="border-gl-border-input bg-gl-surface flex items-center gap-2.5 rounded-[10px] border px-3">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  background: selectedCategory
                    ? getCategorySwatchVar(selectedCategory.id)
                    : 'var(--gl-border)',
                }}
                aria-hidden="true"
              />
              <select
                id="sheet-category"
                value={effectiveCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="text-gl-text h-[42px] flex-1 appearance-none bg-transparent text-[14px] outline-none"
              >
                {active.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: 'var(--gl-surface)' }}>
                    {c.name}
                  </option>
                ))}
              </select>
              <IconChevronDown size={12} className="text-gl-text-muted shrink-0" />
            </div>

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {selectedCategory.subcategories
                  .filter((s) => !s.isCompleted)
                  .map((sub) => (
                    <span
                      key={sub.id}
                      className="border-gl-border bg-gl-bg-subtle text-gl-text-muted rounded-full border px-2.5 py-1 text-[11.5px]"
                    >
                      {sub.name}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Text */}
          <div>
            <label
              htmlFor="sheet-text"
              className="text-gl-text mb-2 block text-[12.5px] font-semibold"
            >
              What did you do?
            </label>
            <textarea
              id="sheet-text"
              rows={5}
              placeholder="One line, a list, or a full reflection."
              className="border-gl-border-input bg-gl-surface text-gl-text placeholder:text-gl-text-faint focus-visible:border-gl-primary w-full resize-y rounded-[10px] border px-3.5 py-3 text-[14px] leading-relaxed outline-none"
            />
          </div>

          {/* Score */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="sheet-score" className="text-gl-text text-[12.5px] font-semibold">
                Productivity score
              </label>
              <span className="text-gl-text-muted font-mono text-[12px]">{score} / 10</span>
            </div>
            <input
              id="sheet-score"
              type="range"
              min="1"
              max="10"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="accent-gl-primary w-full"
            />
            <div className="text-gl-text-faint mt-1 flex justify-between font-mono text-[10.5px]">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-gl-border flex justify-end gap-2.5 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="text-gl-text-muted hover:text-gl-text rounded-[10px] px-4 py-[11px] text-[13.5px] font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="bg-gl-primary-soft text-gl-primary hover:bg-gl-primary-soft/80 rounded-[10px] px-[18px] py-[11px] text-[13.5px] font-semibold"
          >
            Save entry
          </button>
        </div>
      </aside>
    </>
  );
}
