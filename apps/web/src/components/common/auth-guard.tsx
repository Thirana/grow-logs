'use client';

// Client-side auth guard — restores session from sessionStorage on page reload,
// then redirects to /login if the session cannot be verified.
// Used by: app/(dashboard)/layout.tsx
import { type JSX, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/auth.store';
import { useRestoreSession } from '@/hooks/use-auth';
import { FullPageSpinner } from '@/components/common/full-page-spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): JSX.Element {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Attempts to restore the session by calling GET /users/me with the token
  // recovered from sessionStorage. Only fires when isAuthenticated is false and
  // the _gl_session cookie is present — otherwise it's disabled immediately.
  const { isLoading: isRestoring } = useRestoreSession();

  useEffect(() => {
    // Redirect only when we know restoration is not running and has not succeeded.
    // If restoration fails, the Axios interceptor already clears _gl_session and
    // redirects via window.location — this is a belt-and-suspenders fallback.
    if (!isAuthenticated && !isRestoring) {
      void router.replace('/login');
    }
  }, [isAuthenticated, isRestoring, router]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <FullPageSpinner />;
}
