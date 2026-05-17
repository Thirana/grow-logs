'use client';

// Login form — email + password with inline credential error and redirect logic.
// Used by: app/(auth)/login/page.tsx
import { type JSX, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { loginSchema } from '@grow-logs/schemas';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useLogin } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth.store';
import { getApiErrorMessage, cn } from '@/lib/utils';
import { IconEye, IconEyeOff } from '@/components/common/icons';

type FormValues = z.infer<typeof loginSchema>;

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

export function LoginForm(): JSX.Element {
  const router = useRouter();
  const loginMutation = useLogin();
  const { login: saveSession } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(loginSchema) });

  const inputCls = (hasError: boolean) =>
    cn(
      'bg-gl-bg border-gl-border-input text-gl-text placeholder:text-gl-text-faint',
      'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none',
      'transition-colors',
      'focus-visible:border-gl-primary focus-visible:ring-2 focus-visible:ring-gl-primary/15',
      hasError && 'border-gl-danger focus-visible:border-gl-danger focus-visible:ring-gl-danger/20',
    );

  function onSubmit(values: FormValues): void {
    setFormError(null);
    loginMutation.mutate(values, {
      onSuccess: ({ data }) => {
        saveSession(data.user, data.accessToken);
        if (data.user.onboardingCompleted) {
          void router.replace('/dashboard');
        } else {
          void router.replace('/onboarding');
        }
      },
      onError: (error) => {
        const status = error.response?.status;
        const message = String(error.response?.data?.message ?? '');

        if (status === 401) {
          if (message.toLowerCase().includes('not verified')) {
            void router.replace('/check-email?resend=true');
            return;
          }
          setFormError('Invalid email or password.');
          return;
        }

        toast.error(getApiErrorMessage(error));
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gl-text text-[26px] leading-tight font-bold tracking-[-0.02em]">
          Welcome back
        </h1>
        <p className="text-gl-text-muted mt-1.5 text-[14px] leading-relaxed">
          Log in to your account to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="border-gl-border bg-gl-surface shadow-gl space-y-4 rounded-2xl border p-6">
          <Field id="email" label="Email address" error={errors.email?.message}>
            <input
              {...register('email')}
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
              {...register('password')}
              id="password"
              autoComplete="current-password"
              placeholder="Your password"
              hasError={!!errors.password}
              aria-invalid={!!errors.password}
            />
          </Field>

          {formError && (
            <div
              role="alert"
              className="bg-gl-danger-soft border-gl-danger/20 rounded-lg border px-3.5 py-2.5"
            >
              <p className="text-gl-danger text-[13px] leading-snug">{formError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className={cn(
              'bg-gl-primary text-gl-primary-ink hover:bg-gl-primary-hover',
              'mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-2',
              'rounded-lg py-2.5 text-[14px] font-semibold',
              'focus-visible:ring-gl-primary/40 transition-colors focus-visible:ring-2 focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Logging in…
              </>
            ) : (
              'Log in'
            )}
          </button>
        </div>
      </form>

      <p className="text-gl-text-muted text-center text-[13.5px]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-gl-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
