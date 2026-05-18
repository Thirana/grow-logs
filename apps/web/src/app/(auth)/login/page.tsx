// Login page — entry point for returning users.
// Used by: app/(auth)/layout.tsx (auth shell)
import { type JSX, Suspense } from 'react';
import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Log in',
};

export default function LoginPage(): JSX.Element {
  // Suspense required because LoginForm uses useSearchParams (reads ?next= param)
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
