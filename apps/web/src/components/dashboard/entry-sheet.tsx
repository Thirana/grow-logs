'use client';

// Entry slide-over panel — create mode when entry prop is absent, edit mode when provided.
// Used by: components/dashboard/dashboard-client.tsx
import { type JSX, useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEntrySchema, type CreateEntryDto } from '@grow-logs/schemas';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Entry } from '@grow-logs/types';

import { IconClose } from '@/components/common/icons';
import { GlSelect, type GlSelectOption } from '@/components/common/gl-select';
import { GlDatePicker } from '@/components/common/gl-date-picker';
import { useCategories } from '@/hooks/use-categories';
import { useCreateEntry, useUpdateEntry } from '@/hooks/use-entries';
import { getCategorySwatchVar, getApiErrorMessage, cn } from '@/lib/utils';
import type { ApiError } from '@/hooks/use-categories';

interface EntrySheetProps {
  open: boolean;
  onClose: () => void;
  entry?: Entry;
}

interface FieldProps {
  id?: string;
  label: string;
  error?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

function Field({ id, label, error, right, children }: FieldProps): JSX.Element {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-gl-text text-[12.5px] font-semibold">
          {label}
        </label>
        {right}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-gl-danger mt-1.5 text-[11.5px] leading-snug">
          {error}
        </p>
      )}
    </div>
  );
}

export function EntrySheet({ open, onClose, entry }: EntrySheetProps): JSX.Element {
  const isEdit = !!entry;
  const { data: categories = [] } = useCategories();
  const active = categories.filter((c) => !c.isCompleted);
  const createMutation = useCreateEntry();
  const updateMutation = useUpdateEntry();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateEntryDto>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: {
      type: 'WORK',
      entryDate: new Date().toISOString().split('T')[0],
      categoryId: '',
      subcategoryId: null,
      text: '',
      productivityScore: 7,
    },
  });

  const watchedCategoryId = useWatch({ control, name: 'categoryId' });
  const charCount = (useWatch({ control, name: 'text' }) ?? '').length;
  const scoreValue = useWatch({ control, name: 'productivityScore' }) ?? 7;

  const selectedCategory = active.find((c) => c.id === watchedCategoryId) ?? active[0];
  const activeSubcategories = (selectedCategory?.subcategories ?? []).filter((s) => !s.isCompleted);

  // Entry's category may be completed — show it as a disabled option so the user knows where it is.
  const completedEntryCategory =
    entry && categories.find((c) => c.id === entry.categoryId && c.isCompleted);

  // Reset only when the sheet opens or when a different entry is targeted — not on every
  // category load or field change, which would discard the user's in-progress edits.
  useEffect(() => {
    if (open) {
      reset({
        type: entry?.type ?? 'WORK',
        entryDate: entry?.entryDate
          ? entry.entryDate.slice(0, 10)
          : new Date().toISOString().split('T')[0],
        categoryId: entry?.categoryId ?? active[0]?.id ?? '',
        subcategoryId: entry?.subcategoryId ?? null,
        text: entry?.text ?? '',
        productivityScore: entry?.productivityScore ?? 7,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry?.id]);

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

  function handleError(error: ApiError): void {
    const msg = error.response?.data?.message ?? '';
    if (error.response?.status === 422 && /limit|10.entr/i.test(msg)) {
      toast.error("You've reached today's 10-entry limit. Upgrade to Pro for unlimited entries.");
    } else {
      toast.error(getApiErrorMessage(error));
    }
  }

  function onSubmit(data: CreateEntryDto): void {
    if (isEdit) {
      updateMutation.mutate(
        { id: entry.id, data },
        {
          onSuccess: () => {
            toast.success('Entry updated');
            onClose();
          },
          onError: handleError,
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Entry added');
          onClose();
          reset();
        },
        onError: handleError,
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const todayStr = new Date().toISOString().split('T')[0];

  const categoryOptions: GlSelectOption[] = [
    ...(completedEntryCategory
      ? [
          {
            value: completedEntryCategory.id,
            label: `${completedEntryCategory.name} (completed)`,
            disabled: true,
          },
        ]
      : []),
    ...active.map((c) => ({ value: c.id, label: c.name })),
  ];

  const subcategoryOptions: GlSelectOption[] = [
    { value: '', label: 'None' },
    ...activeSubcategories.map((s) => ({ value: s.id, label: s.name })),
  ];

  const inputCls = (hasError: boolean) =>
    cn(
      'border-gl-border-input bg-gl-surface text-gl-text placeholder:text-gl-text-faint',
      'w-full rounded-[10px] border px-3.5 py-3 text-[14px] outline-none transition-colors',
      'focus-visible:border-gl-primary',
      hasError && 'border-gl-danger',
    );

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
        aria-label={isEdit ? 'Edit entry' : 'New entry'}
        className={`border-gl-border bg-gl-surface shadow-gl-lg fixed inset-y-0 right-0 z-60 flex w-[480px] max-w-full flex-col border-l transition-transform duration-[280ms] ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="border-gl-border flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-gl-text text-[18px] leading-snug font-bold tracking-[-0.018em]">
              {isEdit ? 'Edit entry' : 'New entry'}
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
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="bg-gl-surface-2 text-gl-text-muted hover:text-gl-text inline-flex size-8 items-center justify-center rounded-lg transition-colors"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Scrollable body — separate from <form> so absolute dropdowns aren't clipped */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <form
            id="entry-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-[22px] p-6"
          >
            {/* Type */}
            <Field label="Type">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="border-gl-border bg-gl-bg-subtle inline-flex rounded-[10px] border p-1">
                    {(['WORK', 'LEARNING'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => field.onChange(opt)}
                        className={cn(
                          'rounded-[7px] px-4 py-2 text-[13px] font-medium transition-colors duration-[120ms]',
                          field.value === opt
                            ? 'border-gl-border bg-gl-surface text-gl-text shadow-gl border'
                            : 'text-gl-text-muted border border-transparent',
                        )}
                      >
                        {opt === 'WORK' ? 'Work' : 'Learning'}
                      </button>
                    ))}
                  </div>
                )}
              />
            </Field>

            {/* Date */}
            <Field id="entry-date" label="Date" error={errors.entryDate?.message}>
              <Controller
                name="entryDate"
                control={control}
                render={({ field }) => (
                  <GlDatePicker
                    key={entry?.id ?? ''}
                    id="entry-date"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    max={todayStr}
                    error={!!errors.entryDate}
                  />
                )}
              />
            </Field>

            {/* Category */}
            <Field id="entry-category" label="Category" error={errors.categoryId?.message}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => {
                  const cat = active.find((c) => c.id === field.value);
                  return (
                    <GlSelect
                      id="entry-category"
                      options={categoryOptions}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        setValue('subcategoryId', null);
                      }}
                      error={!!errors.categoryId}
                      leading={
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{
                            background: cat ? getCategorySwatchVar(cat.id) : 'var(--gl-border)',
                          }}
                          aria-hidden="true"
                        />
                      }
                    />
                  );
                }}
              />
            </Field>

            {/* Subcategory — only rendered when the selected category has active subcategories */}
            {activeSubcategories.length > 0 && (
              <Field
                id="entry-subcategory"
                label="Subcategory"
                error={errors.subcategoryId?.message}
              >
                <Controller
                  name="subcategoryId"
                  control={control}
                  render={({ field }) => (
                    <GlSelect
                      id="entry-subcategory"
                      options={subcategoryOptions}
                      value={field.value ?? ''}
                      onChange={(val) => field.onChange(val || null)}
                    />
                  )}
                />
              </Field>
            )}

            {/* Text */}
            <Field
              id="entry-text"
              label="What did you do?"
              error={errors.text?.message}
              right={
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    charCount > 950 ? 'text-gl-danger' : 'text-gl-text-muted',
                  )}
                >
                  {charCount} / 1000
                </span>
              }
            >
              <textarea
                {...register('text')}
                id="entry-text"
                rows={5}
                placeholder="One line, a list, or a full reflection."
                className={cn(inputCls(!!errors.text), 'resize-y leading-relaxed')}
              />
            </Field>

            {/* Score */}
            <Field
              id="entry-score"
              label="Productivity score"
              right={
                <span className="text-gl-text-muted font-mono text-[12px]">{scoreValue} / 10</span>
              }
            >
              <input
                {...register('productivityScore', { valueAsNumber: true })}
                id="entry-score"
                type="range"
                min="1"
                max="10"
                defaultValue={7}
                className="accent-gl-primary w-full"
              />
              <div className="text-gl-text-faint mt-1 flex justify-between font-mono text-[10.5px]">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </Field>
          </form>
        </div>

        {/* Footer */}
        <div className="border-gl-border flex justify-end gap-2.5 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-gl-text-muted hover:text-gl-text cursor-pointer rounded-[10px] px-4 py-[11px] text-[13.5px] font-semibold"
          >
            Cancel
          </button>
          <button
            form="entry-form"
            type="submit"
            disabled={isPending}
            className={cn(
              'bg-gl-primary-soft text-gl-primary hover:bg-gl-primary-soft/80',
              'inline-flex cursor-pointer items-center gap-2 rounded-[10px] px-[18px] py-[11px] text-[13.5px] font-semibold',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Save entry'
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
