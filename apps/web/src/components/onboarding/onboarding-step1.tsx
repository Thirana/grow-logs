'use client';

// Onboarding step 1 — category creation only. Subcategories are handled in step 2.
// Used by: app/(onboarding)/onboarding/page.tsx
import { useState, useRef, type JSX, type KeyboardEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { COLOR_PALETTE, type ColorPalette } from '@grow-logs/schemas';
import type { Category } from '@grow-logs/types';

import { cn } from '@/lib/utils';
import { IconCheck, IconPlus, IconArrowRight } from '@/components/common/icons';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-categories';

const SUGGESTIONS: { label: string; color: ColorPalette }[] = [
  { label: 'Frontend Development', color: '#69B598' },
  { label: 'Backend Development', color: '#8285BA' },
  { label: 'DevOps & Cloud', color: '#62AEBF' },
  { label: 'System Design', color: '#C4A05E' },
  { label: 'Machine Learning', color: '#B87DA2' },
  { label: 'Algorithms & DSA', color: '#7DB8B0' },
  { label: 'Career & Soft Skills', color: '#A87DB8' },
  { label: 'Books & Courses', color: '#B87060' },
];

function nextColor(existingCount: number): ColorPalette {
  return COLOR_PALETTE[existingCount % COLOR_PALETTE.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface CategoryRowProps {
  category: Category;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}

function CategoryRow({ category, onRemove, isRemoving }: CategoryRowProps): JSX.Element {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 border-gl-border bg-gl-surface shadow-gl flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 duration-200">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ background: category.color }}
          aria-hidden="true"
        />
        <span className="text-gl-text truncate text-[14px] font-semibold">{category.name}</span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(category.id)}
        disabled={isRemoving}
        aria-label={`Remove ${category.name}`}
        className="text-gl-text-faint hover:text-gl-danger shrink-0 transition-colors disabled:pointer-events-none disabled:opacity-40"
      >
        {isRemoving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <span className="block size-5 text-center text-[18px] leading-none">×</span>
        )}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface OnboardingStep1Props {
  onContinue: () => void;
}

export function OnboardingStep1({ onContinue }: OnboardingStep1Props): JSX.Element {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [inputValue, setInputValue] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addedNames = new Set(categories.map((c) => c.name.toLowerCase()));
  const atLimit = categories.length >= 5;

  function handleAddCategory(name: string, color?: ColorPalette): void {
    const trimmed = name.trim();
    if (!trimmed || atLimit) return;
    const resolvedColor = color ?? nextColor(categories.length);
    createCategory.mutate(
      { name: trimmed, color: resolvedColor },
      { onSuccess: () => setInputValue('') },
    );
  }

  function handleRemoveCategory(id: string): void {
    setRemovingId(id);
    deleteCategory.mutate(id, { onSettled: () => setRemovingId(null) });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory(inputValue);
    }
  }

  const inputCls = cn(
    'bg-gl-bg border-gl-border-input text-gl-text placeholder:text-gl-text-faint',
    'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors',
    'focus-visible:border-gl-primary focus-visible:ring-2 focus-visible:ring-gl-primary/15',
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="border-gl-border bg-gl-surface mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1">
          <span className="bg-gl-primary size-1.5 rounded-full" />
          <span className="text-gl-text-muted text-[11px] font-medium">Setting up workspace</span>
        </div>
        <h1 className="text-gl-text text-[28px] leading-tight font-bold tracking-[-0.02em] xl:text-[32px]">
          Choose your{' '}
          <span className="bg-gradient-to-r from-[#2EB8A0] to-[#7DDFD0] bg-clip-text text-transparent">
            categories
          </span>
        </h1>
        <p className="text-gl-text-muted mt-2 text-[14px] leading-relaxed">
          Categories organise your log entries. Pick from popular ones below or type your own. You
          can add up to 5.
        </p>
      </div>

      {/* ── Suggestion chips ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-gl-text-faint mb-3 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
          Popular categories — click to add
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => {
            const isAdded = addedNames.has(s.label.toLowerCase());
            return (
              <button
                key={s.label}
                type="button"
                disabled={isAdded || atLimit || createCategory.isPending}
                onClick={() => handleAddCategory(s.label, s.color)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5',
                  'text-[12.5px] font-medium transition-all duration-150',
                  'focus-visible:ring-gl-primary/30 focus-visible:ring-2 focus-visible:outline-none',
                  isAdded
                    ? 'bg-gl-primary text-gl-primary-ink cursor-default border-transparent'
                    : 'border-gl-border bg-gl-surface text-gl-text-muted hover:border-gl-primary/40 hover:text-gl-text hover:bg-gl-surface-2 cursor-pointer',
                  'disabled:pointer-events-none',
                  !isAdded && atLimit && 'opacity-40',
                )}
                aria-pressed={isAdded}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                {s.label}
                {isAdded && <IconCheck size={9} className="text-gl-primary-ink" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Custom category input ────────────────────────────────────────────── */}
      <div className="border-gl-border bg-gl-surface shadow-gl mb-6 rounded-2xl border p-5">
        <label htmlFor="cat-input" className="text-gl-text mb-2 block text-[13px] font-medium">
          Or type a custom category
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="cat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="e.g. Reading & Courses"
            maxLength={100}
            disabled={atLimit}
            className={cn(inputCls, atLimit && 'opacity-50')}
            aria-label="Category name"
          />
          <button
            type="button"
            onClick={() => handleAddCategory(inputValue)}
            disabled={!inputValue.trim() || createCategory.isPending || atLimit}
            aria-label="Add category"
            className={cn(
              'bg-gl-surface-2 border-gl-border text-gl-text-muted hover:text-gl-text',
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2.5',
              'text-[13px] font-medium transition-colors',
              'disabled:pointer-events-none disabled:opacity-40',
            )}
          >
            {createCategory.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <IconPlus size={13} />
            )}
            Add
          </button>
        </div>
      </div>

      {/* ── Selected categories list ─────────────────────────────────────────── */}
      <div className="flex-1">
        {categories.length > 0 ? (
          <>
            <p className="text-gl-text-faint mb-3 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
              Added — {categories.length} / 5
            </p>
            <div className="space-y-2">
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  onRemove={handleRemoveCategory}
                  isRemoving={removingId === cat.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="border-gl-border flex h-full min-h-[80px] items-center justify-center rounded-xl border border-dashed">
            <p className="text-gl-text-faint text-[13px]">Your categories will appear here</p>
          </div>
        )}
      </div>

      {/* ── Continue ─────────────────────────────────────────────────────────── */}
      <div className="mt-8">
        <button
          type="button"
          onClick={onContinue}
          disabled={categories.length === 0}
          className={cn(
            'bg-gl-primary text-gl-primary-ink hover:bg-gl-primary-hover',
            'inline-flex w-full cursor-pointer items-center justify-center gap-2',
            'rounded-lg py-3 text-[14px] font-semibold',
            'focus-visible:ring-gl-primary/40 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none',
            'disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          Continue — add subcategories
          <IconArrowRight size={13} />
        </button>
        {categories.length === 0 && (
          <p className="text-gl-text-faint mt-3 text-center text-[12px]">
            Add at least one category to continue
          </p>
        )}
      </div>
    </div>
  );
}
