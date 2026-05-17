'use client';

// Register form — email + password + confirm password.
// Used by: app/(auth)/register/page.tsx
import { type JSX, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerSchema } from '@grow-logs/schemas';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useRegister } from '@/hooks/use-auth';
import { getApiErrorMessage, cn } from '@/lib/utils';
import { IconEye, IconEyeOff } from '@/components/common/icons';

const formSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-gl-text block text-[13px] font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-gl-danger text-[12px] leading-snug">
          {error}
        </p>
      )}
    </div>
  );
}

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError: boolean;
}

function PasswordInput({ hasError, className, ...props }: PasswordInputProps): JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn(
          'bg-gl-bg border-gl-border-input text-gl-text placeholder:text-gl-text-faint',
          'w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm outline-none',
          'transition-colors',
          'focus-visible:border-gl-primary focus-visible:ring-gl-primary/15 focus-visible:ring-2',
          hasError &&
            'border-gl-danger focus-visible:border-gl-danger focus-visible:ring-gl-danger/20',
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="text-gl-text-faint hover:text-gl-text-muted absolute top-1/2 right-3 -translate-y-1/2 transition-colors focus-visible:outline-none"
        tabIndex={-1}
      >
        {visible ? <IconEyeOff size={15} /> : <IconEye size={15} />}
      </button>
    </div>
  );
}

export function RegisterForm(): JSX.Element {
  const router = useRouter();
  const register = useRegister();

  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  function onSubmit(values: FormValues): void {
    register.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => void router.push('/check-email'),
        onError: (error) => {
          if (error.response?.status === 409) {
            setError('email', { message: 'An account with this email already exists.' });
            return;
          }
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  }

  // Inputs sit inside bg-gl-surface card — bg-gl-bg makes them visually recessed.
  const inputCls = (hasError: boolean) =>
    cn(
      'bg-gl-bg border-gl-border-input text-gl-text placeholder:text-gl-text-faint',
      'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none',
      'transition-colors',
      'focus-visible:border-gl-primary focus-visible:ring-2 focus-visible:ring-gl-primary/15',
      hasError && 'border-gl-danger focus-visible:border-gl-danger focus-visible:ring-gl-danger/20',
    );

  return (
    <div className="space-y-6">
      {/* Trust badge — mirrors the landing page announcement pill style */}
      <div className="border-gl-border bg-gl-surface inline-flex items-center gap-2 rounded-full border px-3 py-1">
        <span className="bg-gl-primary-soft text-gl-primary rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-[0.06em] uppercase">
          Free
        </span>
        <span className="text-gl-text-muted text-[12px]">No credit card required</span>
      </div>

      <div>
        <h1 className="text-gl-text text-[26px] leading-tight font-bold tracking-[-0.02em]">
          Create your account
        </h1>
        <p className="text-gl-text-muted mt-1.5 text-[14px] leading-relaxed">
          Start logging your work and learning today.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="border-gl-border bg-gl-surface shadow-gl space-y-4 rounded-2xl border p-6">
          <Field id="email" label="Email address" error={errors.email?.message}>
            <input
              {...field('email')}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={inputCls(!!errors.email)}
              aria-invalid={!!errors.email}
            />
          </Field>

          <Field id="password" label="Password" error={errors.password?.message}>
            <PasswordInput
              {...field('password')}
              id="password"
              autoComplete="new-password"
              placeholder="Min. 8 chars, 1 number, 1 special"
              hasError={!!errors.password}
              aria-invalid={!!errors.password}
            />
          </Field>

          <Field
            id="confirmPassword"
            label="Confirm password"
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              {...field('confirmPassword')}
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat your password"
              hasError={!!errors.confirmPassword}
              aria-invalid={!!errors.confirmPassword}
            />
          </Field>

          <button
            type="submit"
            disabled={register.isPending}
            className={cn(
              'bg-gl-primary text-gl-primary-ink hover:bg-gl-primary-hover',
              'mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-2',
              'rounded-lg py-2.5 text-[14px] font-semibold',
              'focus-visible:ring-gl-primary/40 transition-colors focus-visible:ring-2 focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {register.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </div>
      </form>

      <p className="text-gl-text-muted text-center text-[13.5px]">
        Already have an account?{' '}
        <Link href="/login" className="text-gl-primary font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
