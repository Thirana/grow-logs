'use client';

// Confirmation dialog for permanently deleting a log entry.
// Used by: components/dashboard/entry-row.tsx
import { type JSX, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useDeleteEntry } from '@/hooks/use-entries';
import { getApiErrorMessage } from '@/lib/utils';

interface DeleteEntryDialogProps {
  open: boolean;
  entryId: string;
  onClose: () => void;
}

export function DeleteEntryDialog({ open, entryId, onClose }: DeleteEntryDialogProps): JSX.Element {
  const mutation = useDeleteEntry();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function handleConfirm(): void {
    mutation.mutate(entryId, {
      onSuccess: () => {
        toast.success('Entry deleted');
        onClose();
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  }

  if (!open) return <></>;

  return (
    <>
      {/* Backdrop */}
      <div className="bg-gl-bg/60 fixed inset-0 z-[70]" onClick={onClose} aria-hidden="true" />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="border-gl-border bg-gl-surface shadow-gl-lg fixed top-1/2 left-1/2 z-[80] w-[400px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border p-6"
      >
        <h2
          id="delete-dialog-title"
          className="text-gl-text text-[16px] font-bold tracking-[-0.015em]"
        >
          Delete entry?
        </h2>
        <p className="text-gl-text-muted mt-2 text-[13.5px] leading-relaxed">
          This entry will be permanently deleted. This cannot be undone.
        </p>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="text-gl-text-muted hover:text-gl-text rounded-[10px] px-4 py-[9px] text-[13.5px] font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="bg-gl-danger-soft text-gl-danger hover:bg-gl-danger-soft/80 inline-flex items-center gap-2 rounded-[10px] px-4 py-[9px] text-[13.5px] font-semibold disabled:pointer-events-none disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
