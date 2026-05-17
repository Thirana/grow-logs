'use client';

// Verify email page — reads token from URL, auto-submits it, and renders loading/success/error state.
// Used by: app/(auth)/layout.tsx (auth shell), email verification links from Resend
import { type JSX } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useVerifyEmail } from '@/hooks/use-auth';
import { ResendVerificationForm } from '@/components/auth/resend-verification-form';
import { JourneyCard, type JourneyStep } from '@/components/auth/auth-journey';
import { IconCheck, IconClose } from '@/components/common/icons';

const STEPS_PENDING: JourneyStep[] = [
  { label: 'Register', state: 'done' },
  { label: 'Check email', state: 'done' },
  { label: 'Verify', state: 'current' },
  { label: 'Start logging', state: 'upcoming' },
];

const STEPS_SUCCESS: JourneyStep[] = [
  { label: 'Register', state: 'done' },
  { label: 'Check email', state: 'done' },
  { label: 'Verify', state: 'done' },
  { label: 'Start logging', state: 'current' },
];

function LoadingState(): JSX.Element {
  return (
    <div className="border-gl-border bg-gl-surface shadow-gl flex flex-col items-center gap-5 rounded-2xl border p-10">
      <Loader2 size={32} className="text-gl-primary animate-spin" />
      <p className="text-gl-text-muted text-[15px]">Verifying your email…</p>
    </div>
  );
}

function SuccessState(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="border-gl-border bg-gl-surface shadow-gl space-y-5 rounded-2xl border p-7">
        <div className="relative inline-flex">
          <div
            className="bg-gl-primary/[0.07] absolute inset-0 rounded-2xl blur-md"
            aria-hidden="true"
          />
          <div className="bg-gl-primary-soft relative inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <IconCheck size={22} className="text-gl-primary" />
          </div>
        </div>

        <div>
          <h1 className="text-gl-text text-[22px] leading-tight font-bold tracking-[-0.015em]">
            Email verified!
          </h1>
          <p className="text-gl-text-muted mt-2 text-[14px] leading-relaxed">
            Your account is now active. You can log in and start tracking your progress.
          </p>
        </div>

        <Link
          href="/login"
          className="bg-gl-primary text-gl-primary-ink hover:bg-gl-primary-hover flex h-10 w-full items-center justify-center rounded-xl text-[14.5px] font-semibold transition-colors"
        >
          Go to login
        </Link>
      </div>
      <JourneyCard steps={STEPS_SUCCESS} />
    </div>
  );
}

interface ErrorStateProps {
  message: string;
}

function ErrorState({ message }: ErrorStateProps): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="border-gl-border bg-gl-surface shadow-gl space-y-5 rounded-2xl border p-7">
        <div className="relative inline-flex">
          <div
            className="bg-gl-danger/[0.06] absolute inset-0 rounded-2xl blur-md"
            aria-hidden="true"
          />
          <div className="bg-gl-danger-soft relative inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <IconClose size={22} className="text-gl-danger" />
          </div>
        </div>

        <div>
          <h1 className="text-gl-text text-[22px] leading-tight font-bold tracking-[-0.015em]">
            Verification failed
          </h1>
          <p className="text-gl-text-muted mt-2 text-[14px] leading-relaxed">{message}</p>
        </div>

        <div className="border-gl-border border-t" />

        <div>
          <p className="text-gl-text-muted mb-4 text-[13px]">
            Request a new verification link below:
          </p>
          <ResendVerificationForm />
        </div>
      </div>

      <JourneyCard steps={STEPS_PENDING} />

      <Link
        href="/login"
        className="text-gl-text-muted hover:text-gl-text flex items-center gap-1.5 text-[13.5px] transition-colors"
      >
        <span aria-hidden="true">←</span>
        Back to login
      </Link>
    </div>
  );
}

export default function VerifyEmailPage(): JSX.Element {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { isLoading, isSuccess, isError, error } = useVerifyEmail(token);

  if (!token) {
    return <ErrorState message="No verification token found." />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (isSuccess) {
    return <SuccessState />;
  }

  if (isError) {
    const message = error?.response?.data.message ?? 'This link has expired or is invalid.';
    return <ErrorState message={message} />;
  }

  return <LoadingState />;
}
