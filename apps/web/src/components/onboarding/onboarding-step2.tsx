'use client';

// Onboarding step 2 — add subcategories for every category created in step 1.
// Mobile: category chips scroll horizontally above the editor.
// Desktop (lg+): category tabs in a left sidebar; editor fills the right.
// Single DOM tree — responsive classes only, no duplicate rendering.
// Used by: app/(onboarding)/onboarding/page.tsx
import { useState, type JSX, type KeyboardEvent } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { IconCheck, IconPlus, IconArrowRight } from '@/components/common/icons';
import { useCategories, useCreateSubcategory } from '@/hooks/use-categories';

// ── Suggestion map ────────────────────────────────────────────────────────────

const SUBCATEGORY_SUGGESTIONS: Record<string, string[]> = {
  'frontend development': ['React', 'Next.js', 'TypeScript', 'CSS & Tailwind', 'Testing'],
  'backend development': ['Node.js', 'REST APIs', 'Databases', 'Auth & Security', 'Testing'],
  'devops & cloud': ['Docker', 'CI/CD', 'Kubernetes', 'AWS', 'Monitoring'],
  'system design': ['Architecture', 'Scalability', 'Design Patterns', 'Caching', 'Databases'],
  'machine learning': ['ML Models', 'Data Prep', 'PyTorch', 'Research Papers', 'MLOps'],
  'algorithms & dsa': [
    'Arrays & Strings',
    'Trees & Graphs',
    'Dynamic Programming',
    'Sorting',
    'Math',
  ],
  'career & soft skills': ['Interviews', 'Networking', 'Resume', 'Leadership', 'Communication'],
  'books & courses': ['Books', 'Online Courses', 'Articles', 'Podcasts', 'Videos'],
};

function getSuggestions(categoryName: string): string[] {
  return SUBCATEGORY_SUGGESTIONS[categoryName.toLowerCase()] ?? [];
}

// ── Main component ────────────────────────────────────────────────────────────

interface OnboardingStep2Props {
  onContinue: (categoryCount: number) => void;
}

export function OnboardingStep2({ onContinue }: OnboardingStep2Props): JSX.Element {
  const { data: categories = [] } = useCategories();
  const createSubcategory = useCreateSubcategory();

  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [subcatInput, setSubcatInput] = useState('');

  const resolvedActiveId = activeCategoryId || categories[0]?.id || '';
  const activeCategory = categories.find((c) => c.id === resolvedActiveId) ?? null;
  const suggestions = getSuggestions(activeCategory?.name ?? '');

  function selectCategory(id: string): void {
    setActiveCategoryId(id);
    setSubcatInput('');
  }

  function handleAddSubcategory(name: string): void {
    if (!resolvedActiveId || !name.trim()) return;
    createSubcategory.mutate(
      { categoryId: resolvedActiveId, name: name.trim() },
      { onSuccess: () => setSubcatInput('') },
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubcategory(subcatInput);
    }
  }

  const inputCls = cn(
    'bg-gl-bg border-gl-border-input text-gl-text placeholder:text-gl-text-faint',
    'w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none transition-colors',
    'focus-visible:border-gl-primary focus-visible:ring-2 focus-visible:ring-gl-primary/15',
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="border-gl-border bg-gl-surface mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1">
          <span className="bg-gl-primary size-1.5 rounded-full" />
          <span className="text-gl-text-muted text-[11px] font-medium">
            Customise your workspace
          </span>
        </div>
        <h1 className="text-gl-text text-[26px] leading-tight font-bold tracking-[-0.02em] lg:text-[28px] xl:text-[32px]">
          Add{' '}
          <span className="bg-gradient-to-r from-[#2EB8A0] to-[#7DDFD0] bg-clip-text text-transparent">
            subcategories
          </span>
        </h1>
        <p className="text-gl-text-muted mt-1.5 text-[13.5px] leading-relaxed lg:text-[14px]">
          Break each category into focused topics. Subcategories are optional.
        </p>
      </div>

      {/* ── Body: single DOM tree, responsive layout ──────────────────────────
          Mobile:  flex-col  — category chips scroll horizontally, editor stacks below
          Desktop: flex-row  — sidebar tabs on left, editor fills right               ── */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
        {/* Category selector
            Mobile:  flex-row, overflow-x-auto, rounded-full chips
            Desktop: flex-col, overflow-y-auto, full-width rounded-xl tabs            */}
        <div
          className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:w-52 lg:flex-col lg:gap-1.5 lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 xl:w-60"
          style={{ scrollbarWidth: 'none' }}
        >
          {categories.map((cat) => {
            const isActive = cat.id === resolvedActiveId;
            const subCount = cat.subcategories.length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-2 border transition-all duration-150',
                  'focus-visible:ring-gl-primary/30 focus-visible:ring-2 focus-visible:outline-none',
                  // Mobile shape: compact pill
                  'rounded-full px-3.5 py-2 text-[12.5px] font-medium',
                  // Desktop shape: full-width card tab
                  'lg:w-full lg:rounded-xl lg:px-3.5 lg:py-3.5 lg:text-[13px]',
                  isActive
                    ? 'border-gl-primary/40 bg-gl-primary-soft'
                    : 'border-gl-border bg-gl-surface hover:border-gl-border-input hover:bg-gl-surface-2',
                )}
              >
                <span
                  className="size-2 shrink-0 rounded-full lg:size-2.5"
                  style={{ background: cat.color }}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'font-medium lg:min-w-0 lg:flex-1 lg:truncate',
                    isActive ? 'text-gl-primary' : 'text-gl-text-muted lg:text-gl-text',
                  )}
                >
                  {cat.name}
                </span>
                {subCount > 0 && (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                      isActive
                        ? 'bg-gl-primary/20 text-gl-primary'
                        : 'bg-gl-surface-2 text-gl-text-muted',
                    )}
                  >
                    {subCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Subcategory editor — single panel, always rendered */}
        <div className="border-gl-border bg-gl-surface shadow-gl flex flex-1 flex-col overflow-y-auto rounded-2xl border p-5 lg:p-6">
          {activeCategory ? (
            <>
              {/* Active category label */}
              <div className="mb-5 flex items-center gap-2.5">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: activeCategory.color }}
                  aria-hidden="true"
                />
                <span className="text-gl-text text-[15px] font-semibold">
                  {activeCategory.name}
                </span>
                {activeCategory.subcategories.length > 0 && (
                  <span className="text-gl-text-muted text-[12px]">
                    — {activeCategory.subcategories.length} added
                  </span>
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-5">
                  <p className="text-gl-text-faint mb-3 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                    Suggested — click to add
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((sub) => {
                      const isAdded = activeCategory.subcategories.some(
                        (s) => s.name.toLowerCase() === sub.toLowerCase(),
                      );
                      return (
                        <button
                          key={sub}
                          type="button"
                          disabled={isAdded || createSubcategory.isPending}
                          onClick={() => handleAddSubcategory(sub)}
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5',
                            'text-[12px] font-medium transition-all duration-150',
                            'focus-visible:ring-gl-primary/30 focus-visible:ring-1 focus-visible:outline-none',
                            isAdded
                              ? 'bg-gl-primary text-gl-primary-ink cursor-default border-transparent'
                              : 'border-gl-border text-gl-text-muted hover:border-gl-border-input hover:text-gl-text',
                            'disabled:pointer-events-none',
                          )}
                          aria-label={isAdded ? `${sub} added` : `Add ${sub}`}
                        >
                          {isAdded ? (
                            <>
                              <IconCheck size={9} className="text-gl-primary-ink" />
                              {sub}
                            </>
                          ) : (
                            <>
                              <IconPlus size={9} />
                              {sub}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom subcategory input */}
              <div className="mb-5">
                <p className="text-gl-text-faint mb-3 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                  Add custom
                </p>
                <div className="flex gap-2">
                  <input
                    value={subcatInput}
                    onChange={(e) => setSubcatInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="e.g. GraphQL, SOLID Principles…"
                    maxLength={100}
                    className={inputCls}
                    aria-label="Subcategory name"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubcategory(subcatInput)}
                    disabled={!subcatInput.trim() || createSubcategory.isPending}
                    aria-label="Add subcategory"
                    className={cn(
                      'bg-gl-bg border-gl-border text-gl-text-muted hover:text-gl-text',
                      'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2.5',
                      'text-[13px] font-medium transition-colors',
                      'disabled:pointer-events-none disabled:opacity-40',
                    )}
                  >
                    {createSubcategory.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <IconPlus size={13} />
                    )}
                    Add
                  </button>
                </div>
              </div>

              {/* Added subcategories */}
              {activeCategory.subcategories.length > 0 && (
                <div className="flex-1">
                  <p className="text-gl-text-faint mb-3 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                    Added
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeCategory.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="animate-in fade-in-0 zoom-in-95 bg-gl-primary text-gl-primary-ink inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium duration-150"
                      >
                        <IconCheck size={9} />
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when no suggestions and no subcategories yet */}
              {activeCategory.subcategories.length === 0 && suggestions.length === 0 && (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-gl-text-faint text-[13px]">
                    No suggestions — type a custom subcategory above
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-gl-text-faint text-[13px]">Select a category to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Continue ─────────────────────────────────────────────────────────── */}
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={() => onContinue(categories.length)}
          className={cn(
            'bg-gl-primary text-gl-primary-ink hover:bg-gl-primary-hover',
            'inline-flex w-full cursor-pointer items-center justify-center gap-2',
            'rounded-lg py-3 text-[14px] font-semibold',
            'focus-visible:ring-gl-primary/40 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none',
          )}
        >
          Continue to finish
          <IconArrowRight size={13} />
        </button>
        <p className="text-gl-text-faint mt-2.5 text-center text-[12px]">
          Subcategories are optional — you can always add them later
        </p>
      </div>
    </div>
  );
}
