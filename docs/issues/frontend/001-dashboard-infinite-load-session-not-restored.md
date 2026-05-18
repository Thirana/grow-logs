# Issue 001 — Dashboard stuck in infinite loading loop after page reload

**Date:** 2026-05-17  
**Context:** Visiting `/dashboard` after a page reload while a valid login session existed

---

## What happened

After logging in successfully and navigating to `/dashboard`, the app worked as expected. But on page reload, the dashboard never rendered — it showed a full-page spinner indefinitely.

No error was displayed to the user. The browser network panel showed no requests to `/users/me`. The browser console was silent.

Navigating manually to `/login` redirected back to `/dashboard` instantly. The middleware clearly knew the session was active — but the dashboard was stuck loading and never progressed.

---

## Background: Zustand is in-memory state — it does not survive a page reload

Zustand stores their state in a JavaScript closure that lives in memory. When the page reloads, the JavaScript runtime is torn down and rebuilt from scratch. Every Zustand store resets to its `initialState`.

```typescript
export const useAuthStore = create<AuthState>(() => ({
  user: null,            // ← resets to null on every reload
  isAuthenticated: false, // ← resets to false on every reload
}));
```

This is by design. Zustand does not persist to `localStorage`, `sessionStorage`, or cookies unless you explicitly wire up a persistence middleware like `zustand/middleware/persist`. The grow-logs auth store does not use persistence middleware — and it should not, because the auth state includes a user object that must be validated against the server, not blindly restored from a stale cache.

**The consequence:** immediately after a page reload, `isAuthenticated` is always `false`, regardless of whether the user has a valid session.

---

## Background: Next.js middleware runs on the Edge Runtime before React renders

The Next.js middleware (`middleware.ts`) runs on the [Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes) — a lightweight V8-based sandbox that executes before the React rendering pipeline even starts.

The Edge Runtime has significant constraints:

| Capability          | Available in middleware?                                        |
| ------------------- | --------------------------------------------------------------- |
| Read request cookies | Yes — via `request.cookies`                                    |
| Read request headers | Yes — via `request.headers`                                    |
| Call a backend API  | No — no `fetch` to internal services in the critical path      |
| Read `localStorage` | No — no browser APIs                                            |
| Read `sessionStorage`| No — no browser APIs                                           |
| Verify a JWT        | Only with a pure-JS library; no Node.js crypto modules         |
| Access a database   | No — no TCP sockets                                             |

Because middleware cannot call the backend to verify a JWT, it cannot definitively know whether a user's session is valid. It can only use **signals baked into the request** to make a routing decision.

The grow-logs middleware uses a cookie called `_gl_session` as its routing signal:

```typescript
// middleware.ts
const hasSession = request.cookies.has('_gl_session');

if (isProtectedRoute && !hasSession) {
  return NextResponse.redirect(new URL('/login', request.url));
}
if (isAuthRoute && hasSession) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

This cookie is **not** the `refresh_token` (which is HTTP-only on the API origin and invisible to the Next.js middleware). It is a lightweight routing indicator set by the client when login succeeds and cleared when logout succeeds.

---

## Background: the `_gl_session` cookie as a three-alternatives decision

The middleware needs to distinguish "probably authenticated" from "definitely not authenticated" to avoid redirecting every page load to `/login`. Three alternatives were considered:

**Option A: Verify the JWT in middleware**  
Middleware can verify a JWT using a pure-JS library (e.g. `jose`). This works only if the access token is stored in a cookie — the middleware cannot read `sessionStorage`. Storing the JWT in a non-HTTP-only cookie exposes it to XSS. Storing it in an HTTP-only cookie means JavaScript cannot read it either, breaking the Axios interceptor pattern.

**Option B: Use the HTTP-only `refresh_token` cookie**  
The `refresh_token` cookie is set on the API origin (`:3000`). It is not accessible to the Next.js middleware running on the frontend origin (`:3001`) — cookies are scoped to the domain and port they were set on. Even in production with a shared domain, making the refresh token readable to middleware would require removing the `HttpOnly` flag, which is a security regression.

**Option C: Use a lightweight non-HTTP-only indicator cookie (`_gl_session`)**  
A cookie that contains no sensitive value — just `1` — is set by the client when login succeeds. Middleware reads it to make a routing decision. The actual authentication check (token validation) happens at the API layer. This is the chosen approach.

The downside of Option C: the cookie can become stale. If a session expires (token invalid, refresh token revoked) but `_gl_session` is still set, middleware will admit the user to a protected route where the API will ultimately reject them. The `AuthGuard` component and Axios response interceptor form a belt-and-suspenders recovery path for this case.

---

## Background: token storage — why `sessionStorage` instead of `localStorage` or in-memory only

The access token needs to survive a same-tab page reload (or the user would be logged out by every F5) but must not survive tab close (natural session expiry).

Three options:

| Option              | Survives page reload | Survives tab close | Readable by server | XSS risk |
| ------------------- | -------------------- | ------------------ | ------------------ | --------- |
| In-memory variable  | No                   | No                 | No                 | Low       |
| `sessionStorage`    | Yes                  | No                 | No                 | Medium    |
| `localStorage`      | Yes                  | Yes                | No                 | Medium    |
| HTTP-only cookie    | Yes                  | Depends on expiry  | Yes (on same origin) | Low     |

`sessionStorage` matches the desired lifecycle exactly: same-tab reloads work, closing the tab logs the user out, and no server-side code can read it (which is fine, since the API uses its own HTTP-only `refresh_token` for persistence).

The access token is written to `sessionStorage` at login and read from `sessionStorage` at module load time:

```typescript
// lib/api.ts — module load time recovery
let accessToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('_gl_access_token') : null;
```

This means that by the time React renders the first component, the Axios request interceptor already has the token available to attach to outgoing requests.

---

## Background: the Axios request/response interceptor pattern

`lib/api.ts` configures an Axios instance with two interceptors:

**Request interceptor** — attaches the access token from memory to every outgoing request:

```typescript
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response interceptor** — catches 401 responses, attempts a silent token refresh, and on failure clears the session and redirects:

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPublicAuth = PUBLIC_AUTH_PATHS.some((p) => originalRequest.url?.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuth) {
      originalRequest._retry = true;
      try {
        await axios.post(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);  // retry with new token
      } catch {
        clearSessionCookie();   // ← must happen BEFORE redirect
        clearAccessToken();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
```

The `_retry` flag prevents infinite retry loops: if the retried request also fails with 401, the interceptor falls through to `Promise.reject` rather than triggering another refresh attempt.

---

## Background: React Query's `enabled` flag as a gate

`useQuery` accepts an `enabled` option. When `enabled` is `false`, the query does not execute — `isLoading` is `false` and no network request is made. When `enabled` changes to `true`, the query fires immediately.

This is the mechanism that lets `useRestoreSession` fire only when the conditions are right:

```typescript
return useQuery({
  queryKey: ['auth', 'me'],
  queryFn: async () => { /* call GET /users/me and restore session */ },
  enabled: !isAuthenticated && hasSessionCookie,
  //       ↑ skip if already logged in   ↑ skip if no session cookie exists
  retry: false,
  staleTime: Infinity,
});
```

The `retry: false` prevents React Query from retrying a 401 — the interceptor already handles it. The `staleTime: Infinity` prevents a second `GET /users/me` if the component re-mounts while the data is fresh.

---

## The root bug: two independent failures that combined into an infinite loop

### Bug 1 — `AuthGuard` redirected to `/login` before session restoration could complete

The original `AuthGuard` checked only `isAuthenticated`:

```typescript
// auth-guard.tsx — BEFORE FIX
useEffect(() => {
  if (!isAuthenticated) {
    void router.replace('/login');
  }
}, [isAuthenticated, router]);
```

After a page reload, `isAuthenticated` is `false` (Zustand reset). The effect ran immediately and called `router.replace('/login')`.

There was no restoration hook — `GET /users/me` was never called. The session token sat in `sessionStorage` unused.

### Bug 2 — the Axios response interceptor did not clear `_gl_session` before redirecting

When a `GET /users/me` call failed with 401 (expired token, no valid refresh), the interceptor's catch block did this:

```typescript
// lib/api.ts — BEFORE FIX
clearAccessToken();
window.location.href = '/login';
// _gl_session cookie was NOT cleared
```

The `_gl_session` cookie remained set. When the browser loaded `/login`, the middleware read the cookie and immediately redirected back to `/dashboard`. The dashboard mounted, `AuthGuard` saw `!isAuthenticated`, called `router.replace('/login')`, and the middleware bounced back again — an infinite loop.

### How they combined

Even after `useRestoreSession` was added (fixing Bug 1), Bug 2 remained. If the access token in `sessionStorage` was valid, restoration succeeded. But if the token had expired, the 401 interceptor fired, didn't clear the cookie, redirected to `/login`, and the middleware instantly bounced back to `/dashboard` — the spinner reappeared indefinitely.

The two bugs were independent. Either one alone could cause a degraded experience. Together they produced a complete deadlock.

---

## Fix

### Fix 1 — add `useRestoreSession` to `AuthGuard`

Instead of redirecting immediately when `isAuthenticated` is false, wait until session restoration has either succeeded or definitively failed:

```typescript
// auth-guard.tsx — AFTER FIX
export function AuthGuard({ children }: AuthGuardProps): JSX.Element {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const { isLoading: isRestoring } = useRestoreSession();

  useEffect(() => {
    // Only redirect when restoration is not running and has not succeeded
    if (!isAuthenticated && !isRestoring) {
      void router.replace('/login');
    }
  }, [isAuthenticated, isRestoring, router]);

  if (isAuthenticated) return <>{children}</>;
  return <FullPageSpinner />;
}
```

### Fix 2 — clear `_gl_session` in the Axios interceptor before redirecting

The cookie must be cleared before `window.location.href` executes, or the middleware will bounce the redirect:

```typescript
// lib/api.ts — AFTER FIX (response interceptor catch block)
} catch {
  clearSessionCookie();   // ← added; must come before redirect
  clearAccessToken();
  window.location.href = '/login';
}
```

### Fix 3 — add `restoreSession` action to the auth store

Session restoration needs a dedicated store action that sets `user` and `isAuthenticated` without touching the token (which is already in memory from `sessionStorage`):

```typescript
// auth.store.ts
restoreSession: (user) => set({ user, isAuthenticated: true }),
// Does NOT call setAccessToken — lib/api.ts already recovered the token at module load
```

### Fix 4 — persist and recover the access token from `sessionStorage`

Token storage was updated from pure in-memory to `sessionStorage`-backed:

```typescript
// lib/api.ts
let accessToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('_gl_access_token') : null;

export function setAccessToken(token: string): void {
  accessToken = token;
  if (typeof window !== 'undefined') sessionStorage.setItem('_gl_access_token', token);
}

export function clearAccessToken(): void {
  accessToken = null;
  if (typeof window !== 'undefined') sessionStorage.removeItem('_gl_access_token');
}
```

---

## The happy path after the fix

**First load (after login):**
1. Login succeeds → `login()` sets `isAuthenticated: true`, stores token in `sessionStorage`, sets `_gl_session=1` cookie
2. Dashboard renders immediately — no restoration needed (`isAuthenticated` is already true)

**Page reload:**
1. JavaScript reloads — Zustand resets: `isAuthenticated: false`
2. `lib/api.ts` module evaluates — reads token from `sessionStorage`, stores in memory
3. Middleware runs — reads `_gl_session=1` — allows access to `/dashboard`
4. `AuthGuard` mounts — `isAuthenticated: false`, but `isRestoring: true` (query is running)
5. `useRestoreSession` fires `GET /users/me` — request interceptor attaches token
6. API validates token → returns user profile
7. `restoreSession(user)` sets `isAuthenticated: true`
8. `AuthGuard` re-renders — `isAuthenticated: true` — renders children

**Expired token on reload:**
1. Steps 1–5 same as above
2. API rejects with 401 → response interceptor fires
3. Interceptor tries `POST /auth/refresh` — fails (no valid refresh token in HTTP-only cookie)
4. `clearSessionCookie()` clears `_gl_session` — `clearAccessToken()` clears token
5. `window.location.href = '/login'` — middleware reads no `_gl_session` — allows `/login`
6. User sees the login page cleanly

---

## The rule this reveals

**Every piece of state that must survive a page reload needs an explicit persistence strategy.** In-memory state (Zustand, React state, module-level variables) is reset on every reload. Each piece of state needs a deliberate decision:

| State piece         | Persistence strategy                          | Reason                                              |
| ------------------- | --------------------------------------------- | --------------------------------------------------- |
| Access token        | `sessionStorage` (survive reload, not tab close) | Must be available to Axios before React renders  |
| `isAuthenticated`   | Not persisted — derived from server on reload | Stale boolean in storage cannot be trusted          |
| `user` object       | Not persisted — derived from server on reload | Profile may have changed since last load            |
| `_gl_session` cookie| Set at login, cleared at logout/401           | Only signal readable by Edge Runtime middleware     |

**A redirect must clean up all routing signals before firing.** If a redirect leaves a cookie or flag that will cause middleware to bounce it back, the redirect creates a loop. The rule: before any `window.location.href = '/login'`, all middleware-readable session indicators must be cleared.

---

## How to avoid next time

Before adding a redirect in a context that sits between the browser and the server (middleware, client-side guards, interceptors), trace the full round trip:

1. What routing signals does the middleware read on the next request?
2. Are all those signals cleared before the redirect fires?
3. Is there any intermediate state that contradicts what the redirect implies?

When state resets on reload, never assume it means the session is gone. Check whether a recovery path exists and gate redirects behind it. The pattern is always: **check for a recovery signal → attempt recovery → redirect only on definitive failure**.
