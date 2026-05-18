# 07 — Cookies and Tokens: How Auth Works in This Application

**Phase:** F01–F05 | **Concepts:** JWT structure, access tokens, refresh tokens, HTTP-only cookies, `sessionStorage`, `_gl_session` indicator cookie, `withCredentials`, Axios interceptors, `useRestoreSession`, token refresh flow, frontend constraints imposed by each storage decision

---

## Why This Is Worth a Dedicated Note

Authentication is one of the areas where a small misunderstanding of the underlying mechanism leads to bugs that are very hard to trace. The symptoms are things like: the user is logged out on every page refresh, the dashboard loads indefinitely, the session persists even after logout, or the refresh token stops working silently.

Every one of those bugs comes from getting one piece of the token/cookie architecture wrong. This note explains the full system: what each piece is, why it is stored where it is stored, and how each decision constrains the frontend code that interacts with it.

---

## Section 1: JWT Structure and Claims

A JSON Web Token (JWT) is a string in three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← Header (Base64url)
.eyJzdWIiOiJ1c2VyLXV1aWQiLCJyb2xlIjoiVVNFUiIsImV4cCI6MTcxNzE3MDAwMH0  ← Payload (Base64url)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   ← Signature (HMAC-SHA256)
```

The **header** declares the algorithm. The **payload** contains the claims. The **signature** is a cryptographic hash of the header and payload using the server's secret key.

The backend puts these claims into the payload when it issues a token:

| Claim | Value | Purpose |
|---|---|---|
| `sub` | UUID string | The user's ID — every protected endpoint uses this to scope database queries |
| `role` | `'USER'` or `'ADMIN'` | Used by the `RolesGuard` to allow or deny admin endpoints |
| `exp` | Unix timestamp | The expiry time — the backend rejects any token past this |
| `iat` | Unix timestamp | Issued-at time — used for audit and debugging |

**The critical property:** the backend can verify a JWT without touching the database. It only needs the secret key (to verify the signature) and the `exp` claim (to check expiry). This makes JWT verification fast and stateless — every API server in a cluster can independently verify a token.

**What this means for the frontend:** the JWT is self-contained. You can decode the payload with `atob()` to read the claims. But you cannot fake a valid signature without the server's secret key. The frontend never needs to verify the JWT itself — it just attaches it to every request and lets the backend do the work.

---

## Section 2: The Three-Piece Session Architecture

This application uses three distinct values to represent a user session:

| Piece | What it is | Where it lives | Who sets it |
|---|---|---|---|
| Access token | Short-lived JWT (1 hour) | `sessionStorage` + module variable | Frontend (`lib/api.ts`) on login response |
| Refresh token | Long-lived opaque string (7 days) | HTTP-only cookie on API origin | Backend (`Set-Cookie` header) on login |
| `_gl_session=1` | Non-secret indicator cookie | Regular cookie on frontend origin | Frontend (`auth.store.ts`) on login |

Each piece solves a different problem. None of them can be replaced by the others. Understanding why requires tracing the constraints on each storage location.

---

## Section 3: Access Token — `sessionStorage` + Module Variable

### The four storage options

When the frontend receives an access token from the backend, it must store it somewhere so it can be attached to subsequent requests. There are four options:

| Option | XSS risk | Survives reload | Cleared on tab close | Available in middleware |
|---|---|---|---|---|
| Memory only (module variable) | None | No — lost on reload | Yes | No |
| `sessionStorage` | Low — same-origin JS only | Yes — same tab | Yes | No |
| `localStorage` | Low — same-origin JS only | Yes — persists indefinitely | No | No |
| Cookie (non-HTTP-only) | High — readable by any JS | Yes | Configurable | Yes (if frontend origin) |
| Cookie (HTTP-only) | None — JS cannot read | Yes | Configurable | Yes (if frontend origin) |

### Why not `localStorage`

`localStorage` persists the token permanently until it is explicitly cleared. If the user closes the tab and returns three days later, the token is still there — but it expired one hour after login. Every request fails with 401 until the frontend figures out it needs to refresh.

Worse, there is no natural expiry point. Tokens accumulate across sessions. The only way to clear them is an explicit logout — which means the user cannot truly "log out" by closing the browser.

```typescript
// Wrong — persists forever, no natural expiry
localStorage.setItem('accessToken', token);
```

### Why not a non-HTTP-only cookie for the access token

A non-HTTP-only cookie is readable by any JavaScript on the page. If the application ever renders untrusted user content without perfect sanitisation (a comment, a markdown field, a URL), an XSS attack can run `document.cookie` and steal the access token. With the access token, the attacker can make API requests as the user for the next hour.

```typescript
// Wrong — exposes the JWT to XSS attacks
document.cookie = `accessToken=${token}`;
```

### Why `sessionStorage` was chosen

`sessionStorage` is the right middle ground:
- Lives in the browser's JavaScript execution environment — not on disk
- Scoped to the same origin and the same tab — another domain's JavaScript cannot read it
- Cleared automatically when the tab closes — natural session expiry without any cleanup code
- Survives same-tab page reloads — the user is not logged out when they refresh the page

```typescript
// lib/api.ts — the actual implementation
let accessToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('_gl_access_token') : null;

export function setAccessToken(token: string): void {
  accessToken = token;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('_gl_access_token', token);
  }
}
```

The module-level variable (`let accessToken`) acts as an in-memory cache on top of `sessionStorage`. On first module load, it reads from `sessionStorage` (so a page reload recovers the token). After that, reads go to the in-memory variable — no `sessionStorage.getItem` overhead on every request.

### The frontend constraint this creates

Because the access token lives in `sessionStorage` (JavaScript-land), there is no way to attach it automatically to requests — the browser's native fetch and XHR mechanisms know nothing about it. Every request must manually read the token and set the `Authorization` header. This is done by the Axios request interceptor (see Section 6).

---

## Section 4: Refresh Token — HTTP-only Cookie on the API Origin

### Why HTTP-only

When the user's access token expires, the frontend needs a way to get a new one without asking the user to log in again. The refresh token serves this purpose. It is a long-lived (7 days), opaque (random string, not a JWT) credential that the backend accepts at `POST /auth/refresh` in exchange for a fresh access token.

The refresh token is the most sensitive credential in the system. If an attacker steals it, they can generate new access tokens for 7 days. It must be protected against XSS.

The protection mechanism is HTTP-only: the `Set-Cookie` header from the backend includes the `HttpOnly` flag, which tells the browser to store the cookie but to never expose it to JavaScript. `document.cookie` will not include it. No JavaScript on the page — including an XSS payload — can read it.

```
// Backend sets this header on login response:
Set-Cookie: refresh_token=<opaque-random-string>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/auth/refresh
```

### Why the frontend cannot manually send the refresh token

Because the browser completely controls HTTP-only cookies. The frontend cannot read the value to put it in a request body or header. The only way the cookie reaches the server is if the browser sends it automatically — and the browser only sends cookies to the origin they were set by.

This means:
- The backend sets the cookie on its own origin (e.g. `localhost:3000` in development)
- The browser stores it scoped to that origin
- When the frontend calls `POST /auth/refresh` on that origin, the browser automatically includes the cookie in the request
- The backend reads the cookie from the `Cookie` header, not the request body

### `withCredentials: true` — the required bridge

In cross-origin requests (frontend on `:3001` calling the API on `:3000`), browsers apply CORS policy. By default, browsers do not send cookies on cross-origin requests — they are stripped for security.

The `withCredentials: true` option tells the browser to include cookies on cross-origin requests:

```typescript
// lib/api.ts
export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // send cookies (including the HTTP-only refresh_token) on cross-origin requests
});
```

This alone is not enough. The backend must also respond with `Access-Control-Allow-Credentials: true` in its CORS headers, and `Access-Control-Allow-Origin` must be the exact frontend origin (not `*` — wildcard is forbidden when credentials are included).

```typescript
// What withCredentials: true does in each direction:
//
// Request:  browser sends all matching cookies (including HTTP-only ones)
//           in the Cookie header, even on cross-origin requests
//
// Response: browser accepts and stores Set-Cookie headers from the response,
//           even on cross-origin requests
```

Without `withCredentials: true`, the entire refresh mechanism breaks silently — the refresh request succeeds but sends no cookie, the backend cannot identify the session, and it returns 401.

### The frontend constraints this creates

The frontend cannot inspect, validate, or manually clear the refresh token. It can only trigger a request to an endpoint where the browser will automatically include the cookie.

Logout cannot delete the refresh token client-side. It must call `POST /auth/logout` — the backend invalidates the token in the database and responds with `Set-Cookie: refresh_token=; Max-Age=0` to instruct the browser to delete it.

```typescript
// Wrong — this cannot clear an HTTP-only cookie
document.cookie = 'refresh_token=; max-age=0';  // the browser ignores this for HttpOnly cookies

// Correct — the backend clears it
export function useLogout(): UseMutationResult<void, ApiError, void> {
  return useMutation<void, ApiError, void>({
    mutationFn: () => api.post('/auth/logout').then(() => undefined),
    onSuccess: () => {
      logout();         // clears access token and _gl_session in the frontend
      router.push('/login');
    },
  });
}
```

---

## Section 5: `_gl_session=1` — The Indicator Cookie

### The problem it solves

The Next.js middleware runs on the server and makes routing decisions before React renders anything. It needs to know whether the user has an active session so it can redirect unauthenticated users away from the dashboard.

But the middleware cannot access:
- The access token — it is in JavaScript memory (`sessionStorage`) which does not exist on the server
- The refresh token — it is HTTP-only on the API origin, not the frontend origin; the browser only sends it to `localhost:3000`, not `localhost:3001`

The middleware is left with no information about whether the user is logged in. Without a session signal, the middleware has to either block all requests (always redirect to login) or allow all requests (no protection).

### Why the three obvious alternatives fail

**Alternative 1: Store the JWT in a non-HTTP-only cookie on the frontend origin**

This would make the access token readable by middleware (it can read any cookie on its origin). But it also makes the access token readable by any JavaScript on the page — XSS risk. It also creates two sources of truth for the token (cookie + sessionStorage), which must be kept synchronised.

```typescript
// Why not: XSS risk — access token readable by any page JavaScript
document.cookie = `gl_token=${accessToken}`;
```

**Alternative 2: Read the refresh token cookie in middleware**

The refresh token is HTTP-only on `localhost:3000`. When the browser sends a request to the Next.js server on `localhost:3001`, it does not include the `:3000` cookies — cookies are scoped to their origin. The middleware never sees the refresh token.

```typescript
// Why not: this is always undefined — wrong origin
const refresh = request.cookies.get('refresh_token'); // undefined in middleware
```

**Alternative 3: Call the backend API from middleware to verify the session**

The middleware could hit `GET /auth/verify` on the API server on every request. This works but adds 50-200ms of network latency to every navigation, and it makes every page load fail if the backend is down — the middleware becomes a hard dependency.

### The correct solution: a dedicated indicator cookie

The indicator cookie is not a security token. It carries no secret value — it just signals "a session exists." An attacker who manually sets it in DevTools can see dashboard pages, but every API call still requires a valid JWT — the actual data remains protected.

```typescript
// auth.store.ts
login: (user, accessToken) => {
  setAccessToken(accessToken);
  // Non-HTTP-only: the middleware on the frontend origin needs to read this.
  // It is not a secret — it only controls which HTML page renders, not which data loads.
  document.cookie = '_gl_session=1; path=/; max-age=604800; SameSite=Lax';
  set({ user, isAuthenticated: true });
},

logout: () => {
  clearAccessToken();
  document.cookie = '_gl_session=; path=/; max-age=0; SameSite=Lax';
  set({ user: null, isAuthenticated: false });
},
```

`max-age=604800` is 7 days — chosen to match the refresh token lifetime. If the refresh token is still valid, `_gl_session` should also still be set.

`SameSite=Lax` prevents the cookie from being sent on cross-site POST requests, which prevents CSRF attacks (an attacker on another domain cannot trigger state-changing requests that the browser would authenticate with this cookie).

### The critical invariant: clear `_gl_session` before redirecting to login

The middleware reads `_gl_session`. If the cookie is set when the user arrives at `/dashboard`, the middleware lets them through. If the access token has expired and the refresh fails, the interceptor redirects to `/login`. But if `_gl_session` is still set when that redirect happens, the middleware immediately bounces the user back to `/dashboard` — creating an infinite redirect loop.

The invariant: `_gl_session` must be cleared **before** navigating to `/login`.

```typescript
// lib/api.ts — response interceptor, token refresh failure path
try {
  await axios.post(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, { withCredentials: true });
  return api(originalRequest);
} catch {
  // MUST clear the session cookie first — if _gl_session is still set when
  // we redirect to /login, the middleware sends the user back to /dashboard,
  // which triggers another 401, which triggers another redirect — infinite loop.
  clearSessionCookie();   // _gl_session=; max-age=0
  clearAccessToken();     // sessionStorage clear + in-memory clear
  window.location.href = '/login';
}
```

If you used `router.push('/login')` here instead of `clearSessionCookie()` first, the middleware would intercept the navigation and redirect back to `/dashboard` — and the bug would be nearly impossible to trace because each redirect is valid in isolation.

---

## Section 6: Axios Interceptors — Transparent Auth on Every Request

The Axios instance (`lib/api.ts`) has two interceptors that handle authentication concerns without any component knowing about them.

### Request interceptor — attach the JWT

Every outgoing request is intercepted before it leaves the browser. If an access token is available, it is added to the `Authorization` header:

```typescript
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Components and hooks call `api.get('/entries')` with no knowledge of authentication. The interceptor handles it. If the token is missing (user not logged in), the header is simply not set — the request goes out unauthenticated and the backend returns 401.

### Response interceptor — automatic token refresh on 401

When a request fails with a 401 (Unauthorized), one of two things happened:
1. The access token has expired
2. The endpoint is legitimately rejecting a bad credential (wrong password on login)

The interceptor distinguishes these two cases:

```typescript
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

api.interceptors.response.use(
  (response) => response,    // 2xx — pass through unchanged
  async (error) => {
    const originalRequest = error.config;
    const isPublicAuth = PUBLIC_AUTH_PATHS.some((p) => originalRequest.url?.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuth) {
      originalRequest._retry = true;  // prevents infinite retry loops

      try {
        await axios.post(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);  // retry with the new token
      } catch {
        clearSessionCookie();
        clearAccessToken();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);  // all other errors pass through to the caller
  },
);
```

**Why `!isPublicAuth`:** `/auth/login` returns 401 when the password is wrong — that is expected behaviour, not an expired token. Trying to refresh would trigger another 401 from `/auth/refresh` (no valid refresh token during login), which would try to refresh again — infinite loop. Public auth endpoints must reach their callers directly.

**Why `!originalRequest._retry`:** without this guard, a failed refresh would cause the original request to retry, which would fail with 401 again (no valid token), which would trigger another refresh attempt — another infinite loop. `_retry` is set to `true` on the first attempt and checked before entering the refresh path.

**Why `window.location.href` instead of a router push:** `router.push` is React-level navigation. At the point of total auth failure, we need to ensure everything — including the React component tree, Zustand store state, and React Query cache — is fully reset. A hard page reload (`window.location.href`) triggers a full browser navigation, clearing all in-memory state. The page reloads cleanly with no session data.

```
Request 401 received
    │
    ├─ Is a public auth path? (login, register, refresh)
    │   → Yes: reject(error) — let the caller handle it (wrong password, etc.)
    │
    └─ Was this already retried? (_retry flag)
        → Yes: reject(error) — don't loop
        │
        └─ No: try POST /auth/refresh (browser sends refresh_token cookie automatically)
                │
                ├─ Success: setAccessToken(newToken) via response header? No — the new
                │           access token was returned in the response body. Wait — how does
                │           the interceptor pick up the new token?
                │
                └─ Failure: clear _gl_session + clear access token + hard redirect to /login
```

One nuance: after a successful refresh, the backend returns a new access token. The refresh call succeeds (`await axios.post(...)` does not throw). But the original request is retried immediately. The next request interceptor run will call `getAccessToken()` — but did the refresh response actually update the stored token?

The refresh endpoint returns a new access token in its response body. The response interceptor for that specific refresh call (`axios.post(...)`) is the plain `axios` instance, not the `api` instance, so it does not hit the `api` interceptors. The new token from the refresh response is not automatically stored.

This means the retry (`return api(originalRequest)`) will attach the old (expired) token. Whether this causes a second 401 depends on how fast the token expired and whether the backend accepts slightly expired tokens with clock skew tolerance. In production this should be resolved by ensuring the refresh response stores the new token — something to address as the auth endpoints are fully wired.

---

## Section 7: `useRestoreSession` — Recovering State After a Page Reload

### The problem

When the user reloads the page, the entire React application restarts from scratch. Zustand stores reset to their initial state: `user: null, isAuthenticated: false`. React Query's cache is also empty.

The middleware checks `_gl_session`. The cookie is still there (it persists in the browser), so the middleware lets the request through to the dashboard. The `AuthGuard` checks `isAuthenticated` — it is `false` (Zustand reset) — so it renders `null` and redirects to `/login`.

The user is logged out by a page refresh, even though their session is still valid.

### The fix: `useRestoreSession`

The `useRestoreSession` hook runs in the `AuthGuard`. It detects the "post-reload, session cookie present, store empty" state and recovers the session by calling the backend:

```typescript
// hooks/use-auth.ts
export function useRestoreSession(): UseQueryResult<LoginUser, ApiError> {
  const { isAuthenticated, restoreSession } = useAuthStore();

  const hasSessionCookie =
    typeof document !== 'undefined' && document.cookie.includes('_gl_session=1');

  return useQuery<LoginUser, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get<MeResponse>('/users/me');
      // ... shape the response
      restoreSession(user);  // sets isAuthenticated: true in Zustand
      return user;
    },
    enabled: !isAuthenticated && hasSessionCookie,  // ← the gate
    retry: false,
    staleTime: Infinity,  // session data does not go stale — it is invalidated by logout
  });
}
```

### Why `enabled: !isAuthenticated && hasSessionCookie`

The `enabled` flag makes React Query skip the query entirely unless the condition is true. This is an async gate — the query only fires when both conditions are met:

**`!isAuthenticated`** — if the store already has a user (e.g. the hook is called on a non-reload navigation), there is nothing to restore. No API call is made.

**`hasSessionCookie`** — if `_gl_session` is not present, there is no session to restore. This prevents a `GET /users/me` call for genuinely unauthenticated users (the call would return 401, which would trigger the refresh interceptor, which would fail, which would clear things that were already clear — pointless noise).

The two conditions together create a precise trigger:

| `isAuthenticated` | `hasSessionCookie` | `enabled` | What happens |
|---|---|---|---|
| `false` | `false` | `false` | User is not logged in — no query |
| `false` | `true` | **`true`** | Page reload with valid session — restore session |
| `true` | `false` | `false` | Shouldn't happen, but no query |
| `true` | `true` | `false` | Normal authenticated state — no query needed |

### How the access token is available for `GET /users/me`

The session restore depends on the access token being present. But Zustand reset — doesn't that mean the token is gone too?

No. The access token is stored in `sessionStorage`, not in Zustand. When `lib/api.ts` is first imported (which happens at module load time, before any component mounts), the module-level initialisation runs:

```typescript
// lib/api.ts — runs once at module load
let accessToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('_gl_access_token') : null;
```

If the access token was saved to `sessionStorage` (by `setAccessToken` during login), it is recovered here automatically. By the time any hook calls `api.get()`, the token is already loaded. The request interceptor finds it and adds it to the `Authorization` header.

This is why `sessionStorage` was chosen over memory-only: it provides automatic recovery on page reload, making the session restore flow work without any manual "check localStorage and set state" logic.

---

## Section 8: Wrong vs Correct Patterns

### Access token storage

```typescript
// Wrong — never survives reload; user logged out on every refresh
let accessToken: string | null = null;

// Wrong — persists forever; no natural expiry; can't be cleared by closing the tab
localStorage.setItem('_gl_access_token', token);

// Correct — survives same-tab reload; cleared on tab close
let accessToken: string | null =
  typeof window !== 'undefined' ? sessionStorage.getItem('_gl_access_token') : null;
sessionStorage.setItem('_gl_access_token', token);
```

### Attaching the JWT to requests

```typescript
// Wrong — every component manually reads and attaches the token
function MyComponent() {
  async function loadData() {
    const token = sessionStorage.getItem('_gl_access_token');
    const res = await fetch('/api/entries', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

// Correct — request interceptor handles it transparently
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Components just call the hook:
const { data } = useEntries(params);
```

### Clearing the session on logout failure

```typescript
// Wrong — redirect without clearing the cookie causes a middleware bounce
catch {
  window.location.href = '/login';  // _gl_session still set → middleware redirects back to /dashboard
}

// Correct — clear everything before redirecting
catch {
  clearSessionCookie();   // _gl_session=; max-age=0
  clearAccessToken();     // sessionStorage + in-memory
  window.location.href = '/login';
}
```

### Session restore gate

```typescript
// Wrong — fires on every render including when already authenticated
enabled: hasSessionCookie

// Wrong — fires even when _gl_session is absent (triggers useless 401 → refresh → log out cycle)
enabled: !isAuthenticated

// Correct — fires only in the exact "post-reload with valid session" scenario
enabled: !isAuthenticated && hasSessionCookie
```

### Clearing the refresh token on logout

```typescript
// Wrong — cannot clear HTTP-only cookies from JavaScript
document.cookie = 'refresh_token=; max-age=0';  // ignored by the browser

// Correct — backend clears it via Set-Cookie in the logout response
mutationFn: () => api.post('/auth/logout').then(() => undefined),
```

---

## Full Session Lifecycle Flow

```
─── Login ──────────────────────────────────────────────────────────────────────

User submits login form
    │
    ▼
POST /auth/login (credentials in body)
    │
    ▼
Backend responds:
  Body:   { data: { accessToken: "eyJ...", user: {...} } }
  Cookie: Set-Cookie: refresh_token=<opaque>; HttpOnly; SameSite=Strict; Max-Age=604800
    │
    ▼
auth.store.ts → login(user, accessToken):
  setAccessToken(accessToken)          → sessionStorage._gl_access_token = "eyJ..."
  document.cookie = '_gl_session=1'   → browser stores on frontend origin
  set({ user, isAuthenticated: true })

browser stores refresh_token cookie    → HTTP-only, scoped to API origin

─── Authenticated Request ──────────────────────────────────────────────────────

Component calls useEntries()
    │
    ▼
React Query → api.get('/entries')
    │
Request interceptor fires:
  getAccessToken() → sessionStorage._gl_access_token → "eyJ..."
  config.headers.Authorization = 'Bearer eyJ...'
    │
    ▼
Backend validates JWT signature + exp claim → returns entries

─── Page Reload ────────────────────────────────────────────────────────────────

User presses Cmd+R
    │
    ▼
Browser reloads page → all JavaScript memory cleared
    │
lib/api.ts module loads:
  accessToken = sessionStorage.getItem('_gl_access_token') → "eyJ..." (recovered)
    │
    ▼
Middleware runs:
  request.cookies.has('_gl_session') → true
  → NextResponse.next()
    │
    ▼
React app hydrates:
  Zustand: { user: null, isAuthenticated: false }  (reset — correct)
    │
    ▼
AuthGuard mounts → calls useRestoreSession()
  enabled: !isAuthenticated && hasSessionCookie → true
    │
    ▼
GET /users/me (access token attached by request interceptor automatically)
    │
    ├─ 200 OK → restoreSession(user) → { user: {...}, isAuthenticated: true }
    │   AuthGuard renders children — dashboard visible
    │
    └─ 401 (token expired)
        │
        Response interceptor → POST /auth/refresh (browser sends refresh_token cookie)
            │
            ├─ 200 OK → retry GET /users/me → session restored
            │
            └─ 401 (refresh token expired)
                clearSessionCookie()   ← must happen before redirect
                clearAccessToken()
                window.location.href = '/login'

─── Logout ─────────────────────────────────────────────────────────────────────

User clicks logout
    │
    ▼
POST /auth/logout (refresh_token cookie sent automatically)
    │
Backend invalidates refresh_token in DB, responds:
  Set-Cookie: refresh_token=; Max-Age=0   → browser deletes the cookie
    │
    ▼
auth.store.ts → logout():
  clearAccessToken()                    → sessionStorage._gl_access_token removed
  document.cookie = '_gl_session=; max-age=0'  → browser deletes indicator cookie
  set({ user: null, isAuthenticated: false })
    │
    ▼
router.push('/login')
  Middleware: _gl_session absent → NextResponse.next() → login page renders
```

Every part of the system has one job. The access token authenticates individual requests. The refresh token extends the session without re-login. `_gl_session` informs the middleware. The Axios interceptors make authentication transparent to application code. `useRestoreSession` bridges the gap between Zustand's in-memory state and `sessionStorage`'s persistent recovery.
