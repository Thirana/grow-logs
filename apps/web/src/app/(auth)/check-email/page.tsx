// Check-email confirmation page — shown after successful registration.
// Used by: app/(auth)/layout.tsx (auth shell), redirected from register-form.tsx
import { type JSX, Fragment } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { IconCheck, IconMail } from '@/components/common/icons';

export const metadata: Metadata = {
  title: 'Check your email',
};

type StepState = 'done' | 'current' | 'upcoming';

const STEPS: Array<{ label: string; state: StepState }> = [
  { label: 'Register', state: 'done' },
  { label: 'Check email', state: 'current' },
  { label: 'Verify', state: 'upcoming' },
  { label: 'Start logging', state: 'upcoming' },
];

interface FlowStepProps {
  label: string;
  state: StepState;
}

function FlowStep({ label, state }: FlowStepProps): JSX.Element {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      {state === 'done' ? (
        <div className="bg-gl-primary-soft border-gl-primary/30 flex size-6 items-center justify-center rounded-full border">
          <IconCheck size={9} className="text-gl-primary" />
        </div>
      ) : state === 'current' ? (
        <div className="border-gl-primary ring-gl-primary/20 flex size-6 items-center justify-center rounded-full border ring-2">
          <span className="bg-gl-primary size-1.5 rounded-full" />
        </div>
      ) : (
        <div className="border-gl-border size-6 rounded-full border" />
      )}
      <span
        className={cn(
          'text-center text-[10.5px] leading-none font-medium whitespace-nowrap',
          state === 'done' && 'text-gl-text-muted',
          state === 'current' && 'text-gl-primary',
          state === 'upcoming' && 'text-gl-text-faint',
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default function CheckEmailPage(): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Card */}
      <div className="border-gl-border bg-gl-surface shadow-gl space-y-5 rounded-2xl border p-7">
        {/* Icon */}
        <div className="relative inline-flex">
          {/* Outer glow ring */}
          <div
            className="bg-gl-primary/[0.07] absolute inset-0 rounded-2xl blur-md"
            aria-hidden="true"
          />
          <div className="bg-gl-primary-soft relative inline-flex h-14 w-14 items-center justify-center rounded-2xl">
            <IconMail size={22} className="text-gl-primary" />
          </div>
        </div>

        {/* Heading + body */}
        <div>
          <h1 className="text-gl-text text-[22px] leading-tight font-bold tracking-[-0.015em]">
            Check your inbox
          </h1>
          <p className="text-gl-text-muted mt-2 text-[14px] leading-relaxed">
            We sent a verification link to your email address. Click the link to activate your
            account — it expires in 24 hours.
          </p>
        </div>

        {/* Divider */}
        <div className="border-gl-border border-t" />

        {/* Resend hint */}
        <p className="text-gl-text-muted text-[13px] leading-relaxed">
          Didn&apos;t get an email? Check your spam folder or{' '}
          <Link
            href="/verify-email?resend=true"
            className="text-gl-primary font-medium hover:underline"
          >
            resend the verification email
          </Link>
          .
        </p>
      </div>

      {/* Auth journey progress */}
      <div className="border-gl-border bg-gl-surface shadow-gl rounded-2xl border px-6 py-5">
        <p className="text-gl-text-faint mb-4 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
          Your journey
        </p>
        <div className="flex items-start">
          {STEPS.map((step, i) => (
            <Fragment key={step.label}>
              <FlowStep label={step.label} state={step.state} />
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mt-3 h-px flex-1 shrink',
                    i === 0 ? 'bg-gl-primary/25' : 'bg-gl-border',
                  )}
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Back to login — understated, outside the cards */}
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
