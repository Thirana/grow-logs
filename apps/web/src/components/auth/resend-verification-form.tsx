'use client';

// Resend verification email form — email input + submit, shows inline confirmation on success.
// Used by: app/(auth)/check-email/page.tsx, app/(auth)/verify-email/page.tsx
import { type JSX, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { resendVerificationSchema } from '@grow-logs/schemas';
import { Loader2 } from 'lucide-react';

import { useResendVerification } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { IconCheck } from '@/components/common/icons';

type ResendFormValues = z.infer<typeof resendVerificationSchema>;

interface ResendVerificationFormProps {
  initialEmail?: string;
  className?: string;
}

export function ResendVerificationForm({
  initialEmail = '',
  className,
}: ResendVerificationFormProps): JSX.Element {
  const [sent, setSent] = useState(false);
  const { mutate, isPending } = useResendVerification();

  const form = useForm<ResendFormValues>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: initialEmail },
  });

  function onSubmit(values: ResendFormValues): void {
    mutate(values, { onSuccess: () => setSent(true) });
  }

  if (sent) {
    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="bg-gl-primary-soft mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
          <IconCheck size={9} className="text-gl-primary" />
        </div>
        <p className="text-gl-text-muted text-[13.5px] leading-relaxed">
          Verification email sent. Check your inbox — and your spam folder if you don&apos;t see it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-3', className)} noValidate>
      <div>
        <label
          htmlFor="resend-email"
          className="text-gl-text-muted mb-1.5 block text-[12.5px] font-medium"
        >
          Email address
        </label>
        <input
          id="resend-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...form.register('email')}
          className={cn(
            'bg-gl-bg border-gl-border text-gl-text placeholder:text-gl-text-faint w-full rounded-xl border px-3.5 py-2.5 text-[14px] transition-[border-color,box-shadow] outline-none',
            'focus:border-gl-primary/50 focus:ring-gl-primary/15 focus:ring-2',
            form.formState.errors.email && 'border-gl-danger/50',
          )}
        />
        {form.formState.errors.email && (
          <p className="text-gl-danger mt-1 text-[12px]">{form.formState.errors.email.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-gl-primary text-gl-primary-ink hover:bg-gl-primary-hover flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold transition-colors disabled:opacity-60"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        Resend verification email
      </button>
    </form>
  );
}
