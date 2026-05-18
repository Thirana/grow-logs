# Step F04 — Route Protection Middleware

**Phase:** 1  
**Status:** ⬜ Not started  
**Depends on:** F01–F03 (all auth pages exist)

---

## Goal

Protect dashboard routes so unauthenticated users are redirected to `/login`, and redirect authenticated users away from auth pages so they cannot revisit `/login` or `/register` while logged in.

---

## What to Build

### `middleware.ts`

Location: `apps/web/src/middleware.ts` (Next.js picks this up automatically).

**Why cookie-based, not store-based:**

The Zustand auth store lives in memory — it is not readable in Next.js middleware, which runs on the server/edge before React renders. The `refresh_token` cookie (HTTP-only, set by the backend on login) is the server-readable proxy for "user has an active session."

**Logic:**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('refresh_token');
  const { pathname } = request.nextUrl;

  const isDashboardRoute = pathname.startsWith('/dashboard') ||
                           pathname.startsWith('/settings') ||
                           pathname.startsWith('/categories') ||
                           pathname.startsWith('/onboarding');

  const isAuthRoute = pathname.startsWith('/login') ||
                      pathname.startsWith('/register');

  if (isDashboardRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/categories/:path*', '/onboarding/:path*', '/login', '/register'],
};
```

**`?next=` param:** Captured when redirecting to login. After a successful login, `LoginForm` reads `searchParams.get('next')` and redirects there instead of `/dashboard`.

Update `LoginForm` to read and use the `next` param:
```typescript
const searchParams = useSearchParams();
const next = searchParams.get('next') ?? (user.onboardingCompleted ? '/dashboard' : '/onboarding');
router.replace(next);
```

### Client-Side Auth Guard: `components/common/auth-guard.tsx`

Middleware handles the initial redirect, but the Zustand store may not be hydrated on the first render. Add a client-side guard component that wraps dashboard layouts.

```typescript
'use client';

export function AuthGuard({ children }: { children: React.ReactNode }): JSX.Element {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return <FullPageSpinner />;

  return <>{children}</>;
}
```

**`FullPageSpinner`** (`components/common/full-page-spinner.tsx`): a centered spinner that fills the viewport. Used as a fallback during auth check.

### Dashboard Layout Update

`app/(dashboard)/layout.tsx` — create if it does not exist:

```typescript
import { AuthGuard } from '@/components/common/auth-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
```

---

## Files Created or Modified

| File | Action |
|---|---|
| `middleware.ts` | Create |
| `components/common/auth-guard.tsx` | Create |
| `components/common/full-page-spinner.tsx` | Create |
| `app/(dashboard)/layout.tsx` | Create |
| `components/auth/login-form.tsx` | Modify — read `?next=` param for post-login redirect |

---

## Done When

- [ ] Visiting `/dashboard` while not logged in redirects to `/login?next=/dashboard`
- [ ] After login, the `?next=` redirect works correctly
- [ ] Visiting `/login` while logged in redirects to `/dashboard`
- [ ] Visiting `/register` while logged in redirects to `/dashboard`
- [ ] The `AuthGuard` component shows a spinner until the store is hydrated, then renders children
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
