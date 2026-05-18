# 06 — Next.js Middleware and Route Protection

**Phase:** F01–F05 | **Concepts:** Edge Runtime, `NextRequest`/`NextResponse`, cookie-based route guards, `_gl_session` pattern, the `matcher` config, redirect semantics, middleware vs client-side guards, testing

---

## What Problem Middleware Solves

Without route protection, any URL in the application is accessible to any visitor. An unauthenticated user can type `/dashboard` into the address bar and see the dashboard — the React components render, the API calls fire (and fail with 401), and the page shows an error or empty state. This is both a security problem and a bad user experience.

There are two places where route protection can live:

**Client-side guards** — a React component reads the auth state and redirects if the user is not authenticated. The page starts rendering, the auth check happens, and then the redirect fires. The user briefly sees the protected page content before being sent away. This "flash" of content is visible on slow connections and is unprofessional.

**Server-side middleware** — code that runs on the server before React renders anything. The check happens before any HTML is sent to the browser. The user is redirected before they see a single pixel of the protected page.

Next.js middleware provides the server-side option.

---

## Section 1: The Edge Runtime

Next.js middleware runs on the **Edge Runtime** — a lightweight server environment designed for speed. It starts in milliseconds (no cold-start delay like a full Node.js process) and handles every matched request.

The Edge Runtime is intentionally constrained. These constraints exist to keep it fast and deployable at the network edge (close to users geographically):

| Constraint | Why it exists |
|---|---|
| No database access | DB connections add latency; Prisma and pg don't work in Edge |
| No full Node.js APIs | Edge Runtime is a subset of the Web standard APIs |
| No heavy npm packages | Bundle must stay small for fast cold starts |
| Limited async work | Long operations would block request processing |

These constraints directly explain why middleware cannot verify a JWT by calling the backend or querying the database. It must make its routing decision from the data already present in the request — cookies and headers.

---

## Section 2: The Middleware File

By Next.js convention, the middleware function lives at `src/middleware.ts`. Next.js picks it up automatically at startup — no imports, no configuration, just the file in the right location.

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has('_gl_session');
  const { pathname } = request.nextUrl;

  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/entries') ||
    pathname.startsWith('/today') ||
    pathname.startsWith('/settings');

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

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
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/categories/:path*',
    '/entries/:path*',
    '/today/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
```

The function receives a `NextRequest` (the incoming HTTP request with typed access to cookies, headers, and URL) and must return a `NextResponse` (either pass through, redirect, or rewrite).

---

## Section 3: The `matcher` Config — Scoping Middleware

Without a `matcher`, middleware would run on every request to the Next.js server — including requests for static assets like images, CSS files, JavaScript bundles, and favicon.

```typescript
// Without matcher — middleware runs on /dashboard AND on /_next/static/chunks/main.js
// This is wasteful; static assets need no auth check

// With matcher — middleware only runs on the listed URL patterns
export const config = {
  matcher: [
    '/dashboard/:path*',   // /dashboard, /dashboard/stats, /dashboard/anything
    '/categories/:path*',  // /categories, /categories/123
    '/login',              // exactly /login
    '/register',           // exactly /register
  ],
};
```

`:path*` is Next.js's pattern syntax — it matches the segment and any sub-path. `/dashboard/:path*` matches `/dashboard`, `/dashboard/weekly`, and `/dashboard/any/depth`.

There is a purposeful overlap between the `matcher` and the `isDashboardRoute` variable in the function body:

- The **matcher** is a performance optimisation — Next.js skips calling the middleware function entirely for paths not listed. Static assets are never touched.
- The **function body** is the logic — it checks the same routes again to decide what action to take.

Both are needed. The matcher prevents unnecessary function invocations. The body handles the actual conditions.

---

## Section 4: Why `_gl_session` Exists

This is the most non-obvious part of the auth architecture. Understanding it requires tracing why every simpler alternative fails.

### Why Not Read the JWT Access Token

The JWT access token is stored in JavaScript memory — a module-level variable in `lib/api.ts`. The middleware runs on the server. Server-side code has no access to the browser's JavaScript heap. The token is invisible.

```typescript
// Impossible — there is no cookie or header containing the JWT
const token = request.cookies.get('accessToken'); // always undefined
```

### Why Not Read the Refresh Token Cookie

The refresh token is stored as an HTTP-only cookie set by the backend on the API origin (`localhost:3000` in development). Two problems:

**HTTP-only** means JavaScript cannot read it. Even if the middleware were running in the browser, `document.cookie` would not include it.

**Origin scoping** means the browser only sends a cookie to the domain (and port) it was set by. The refresh token cookie is scoped to `localhost:3000`. Requests to the Next.js server at `localhost:3001` do not carry it. The middleware on `:3001` never sees it.

```typescript
// This always returns undefined in development
const refresh = request.cookies.get('refresh_token'); // scoped to :3000, not :3001
```

### Why Not Call the Backend API from Middleware

The middleware could call the backend to verify a token on every request. This would work correctly but is architecturally wrong:

```typescript
// Wrong — latency on every page load, defeats the purpose of edge middleware
if (isDashboardRoute) {
  const response = await fetch(`${process.env.API_URL}/auth/verify`, { ... });
  if (!response.ok) return NextResponse.redirect('/login');
}
```

This adds 50-200ms of network latency to every navigation — the opposite of what Edge Runtime is designed for. It also creates a dependency: the middleware fails if the backend is down, making every page unreachable.

### The Correct Solution: A Dedicated Session Indicator Cookie

Since the middleware needs a cookie that is:
- Set on the **frontend origin** (`localhost:3001`) so the browser sends it to Next.js
- Not HTTP-only so it can be set and cleared by JavaScript on login/logout
- Not a security token (it cannot be used to make API calls)

The auth store sets exactly this:

```typescript
// stores/auth.store.ts — login action
login: (user, accessToken) => {
  setAccessToken(accessToken);
  document.cookie = '_gl_session=1; path=/; max-age=604800; SameSite=Lax';
  set({ user, isAuthenticated: true });
},

// logout action
logout: () => {
  clearAccessToken();
  document.cookie = '_gl_session=; path=/; max-age=0; SameSite=Lax';
  set({ user: null, isAuthenticated: false });
},
```

`max-age=604800` is 7 days — chosen to match the refresh token lifetime. `SameSite=Lax` prevents the cookie from being sent in cross-site requests (a security posture against CSRF). `path=/` makes it available on all paths.

The middleware reads it:

```typescript
const hasSession = request.cookies.has('_gl_session');
```

### The Security Model Is Correct Despite the Non-HTTP-Only Cookie

An attacker who manually sets `_gl_session=1` in their browser's DevTools can access the dashboard page HTML. But:
- Every API request from the dashboard requires a valid JWT in the `Authorization` header
- The attacker has no JWT
- Every API call returns 401
- The dashboard shows empty state or error state

`_gl_session` controls which page the browser renders. The API enforces what data the page can access. These are two independent layers. The routing layer (`_gl_session`) being bypassable does not compromise the data layer (JWT validation).

---

## Section 5: The Two Redirect Rules

### Rule 1: Unauthenticated User on a Protected Route

```typescript
if (isDashboardRoute && !hasSession) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}
```

`new URL('/login', request.url)` builds an absolute URL using the current request's origin as the base. This handles both `http://localhost:3001` in development and `https://app.grow-logs.com` in production — the middleware doesn't need to know the domain.

`loginUrl.searchParams.set('next', pathname)` appends the original destination as a query parameter. `pathname` for a request to `/dashboard` is `/dashboard`, which becomes `%2Fdashboard` in the URL (percent-encoded automatically by `URL.searchParams.set`). The result is `/login?next=%2Fdashboard`.

After successful login, the `LoginForm` reads the `next` parameter and redirects there:

```typescript
// components/auth/login-form.tsx
const searchParams = useSearchParams();
const next = searchParams.get('next');  // '/dashboard' — automatically decoded
const fallback = data.user.onboardingCompleted ? '/dashboard' : '/onboarding';
void router.replace((next ?? fallback) as Parameters<typeof router.replace>[0]);
```

Without this `next` parameter, every login would go to the same default page regardless of where the user was trying to go.

### Rule 2: Authenticated User on an Auth Route

```typescript
if (isAuthRoute && hasSession) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

An authenticated user should not be able to reach `/login` or `/register`. If they navigate there manually — typing in the address bar, pressing the browser Back button after logging in — they are immediately redirected to `/dashboard`.

Without this rule, the following loop would be possible: user logs in via `/login`, lands on `/dashboard`, presses Back, lands on `/login` again, is not redirected, and can see the login form while authenticated.

### Rule 3: All Other Cases — Pass Through

```typescript
return NextResponse.next();
```

A request that matches neither condition passes through unchanged. The page renders normally.

---

## Section 6: Middleware vs the `AuthGuard` Component — Two Layers

This project has two layers of auth protection, and they serve different purposes.

**Middleware** (server-side, before React) handles the common case:
- User navigates to a protected URL
- Middleware checks `_gl_session`
- Redirects immediately — no flicker, no React render
- Works for direct URL entry, page refresh, and browser navigation

**`AuthGuard`** in `app/(dashboard)/layout.tsx` (client-side, after React) handles edge cases:
- `_gl_session` cookie might exist but the Zustand store has no user (e.g. after a hot reload in development resets JavaScript memory without clearing the cookie)
- In this case, middleware passes the request through (cookie present), but the auth store says not authenticated
- `AuthGuard` reads `useAuthStore` and redirects to `/login`

```typescript
// app/(dashboard)/layout.tsx
'use client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      void router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;  // don't flash the page before redirecting
  return <>{children}</>;
}
```

In production with a correctly maintained session, `AuthGuard` never triggers — the middleware has already done the work. In development, it catches the hot-reload edge case. In both environments, the user never sees a protected page they shouldn't.

The two layers are complementary, not redundant:

| | Middleware | AuthGuard |
|---|---|---|
| Runs | On the server, before React | On the client, after React hydrates |
| Reads | `_gl_session` cookie | Zustand `isAuthenticated` |
| Handles | All standard navigation | Hot-reload and session expiry edge cases |
| Flicker | None | Shows `null` briefly before redirect |

---

## Section 7: Testing Middleware

The middleware function is a plain function that takes a `NextRequest` and returns a `NextResponse`. It can be tested by calling it directly with a constructed request — no HTTP server needed:

```typescript
// middleware.test.ts
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

function makeRequest(path: string, hasCookie = false): NextRequest {
  const url = `http://localhost:3001${path}`;
  const headers = hasCookie ? { cookie: '_gl_session=1' } : undefined;
  return new NextRequest(url, headers ? { headers } : undefined);
}
```

`makeRequest` constructs a `NextRequest` with the path and optionally the session cookie. The cookie is passed in the `cookie` header because `NextRequest` reads cookies from the `Cookie` HTTP header.

Test cases cover all four branches:

```typescript
// Unauthenticated on a protected route — should redirect with ?next=
it('redirects /dashboard to /login with ?next=/dashboard', () => {
  const res = middleware(makeRequest('/dashboard'));
  expect(res.headers.get('location')).toMatch(/\/login\?next=%2Fdashboard/);
});

// Authenticated on a protected route — should pass through
it('allows /dashboard through when authenticated', () => {
  const res = middleware(makeRequest('/dashboard', true));
  expect(res.headers.get('location')).toBeNull();  // no redirect
});

// Authenticated on an auth route — should redirect to dashboard
it('redirects /login to /dashboard when authenticated', () => {
  const res = middleware(makeRequest('/login', true));
  expect(res.headers.get('location')).toMatch(/\/dashboard/);
});

// Unauthenticated on an auth route — should pass through
it('allows /login through when unauthenticated', () => {
  const res = middleware(makeRequest('/login'));
  expect(res.headers.get('location')).toBeNull();
});
```

`res.headers.get('location')` is `null` when the middleware calls `NextResponse.next()` (no redirect) and contains the redirect URL when `NextResponse.redirect()` is called. The `location` header is how HTTP redirects communicate the destination.

The `%2Fdashboard` encoding in the test assertion confirms that `pathname` is correctly percent-encoded as a query parameter value.

---

## How Middleware Fits in the Full Request Lifecycle

```
Browser: user navigates to /categories

     ↓  HTTP request sent to Next.js server

Middleware (Edge Runtime — before React)
  1. Matches /categories/:path* in the matcher config
  2. Reads _gl_session cookie
  3a. Cookie missing → redirects to /login?next=%2Fcategories → done
  3b. Cookie present → calls NextResponse.next()

     ↓  request passes to Next.js renderer

Next.js builds the layout tree
  app/layout.tsx (Root) → app/(dashboard)/layout.tsx (AuthGuard)
    ↓
  AuthGuard (client component) reads useAuthStore.isAuthenticated
    ↓
  Authenticated → renders children
  Not authenticated → router.replace('/login')

     ↓  page renders

Feature components mount
  useCategories() fires → React Query checks cache
  Cache miss → api.get('/categories') fires
  Request interceptor attaches JWT → backend validates → returns data
  React Query caches response → component re-renders with categories
```

Every layer has one job. Middleware makes the fast routing decision. `AuthGuard` handles the edge case. React Query fetches and caches data. The Axios interceptor handles authentication transparently. No single layer needs to know what the others are doing.
