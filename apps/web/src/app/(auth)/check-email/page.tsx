// Check-email confirmation page — shown after successful registration.
// Used by: app/(auth)/layout.tsx (auth shell), redirected from register-form.tsx and login-form.tsx
import { type JSX } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { IconMail } from '@/components/common/icons';
import { JourneyCard } from '@/components/auth/auth-journey';
import { ResendVerificationForm } from '@/components/auth/resend-verification-form';

export const metadata: Metadata = {
  title: 'Check your email',
};

export default function CheckEmailPage(): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Main card */}
      <div className="border-gl-border bg-gl-surface shadow-gl space-y-5 rounded-2xl border p-7">
        {/* Icon */}
        <div className="relative inline-flex">
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

        {/* Resend section */}
        <div>
          <p className="text-gl-text-muted mb-4 text-[13px]">
            Didn&apos;t get an email? Check your spam folder, or request a new link:
          </p>
          <ResendVerificationForm />
        </div>
      </div>

      {/* Auth journey progress */}
      <JourneyCard
        steps={[
          { label: 'Register', state: 'done' },
          { label: 'Check email', state: 'current' },
          { label: 'Verify', state: 'upcoming' },
          { label: 'Start logging', state: 'upcoming' },
        ]}
      />

      {/* Back to login */}
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
