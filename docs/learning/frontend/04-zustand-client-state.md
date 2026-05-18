# 04 — Zustand: Client State Management

**Phase:** F01–F05 | **Concepts:** client state vs server state, Zustand `create`, selectors, co-located actions, `set`, the auth store, `_gl_session` cookie, why Context doesn't scale

---

## Why Shared State Is Hard in React

React's native mechanism for sharing state between components is: put the state in the nearest common ancestor and pass it down as props. For two sibling components that need the same value, this works fine. When the component that needs the value is five levels deep in the tree, every component in between has to accept and forward a prop it doesn't use. This is called **prop drilling**.

```typescript
// Prop drilling — every layer must pass userId even if it doesn't use it
function App() {
  const [userId, setUserId] = useState<string | null>(null);
  return <Layout userId={userId} />;
}

function Layout({ userId }: { userId: string | null }) {
  return <Sidebar userId={userId} />;  // Layout doesn't use userId
}

function Sidebar({ userId }: { userId: string | null }) {
  return <UserMenu userId={userId} />;  // Sidebar doesn't use userId either
}

function UserMenu({ userId }: { userId: string | null }) {
  return <span>{userId}</span>;  // Only UserMenu actually uses it
}
```

The standard React solution is Context: wrap the tree in a `Provider`, and any component at any depth can read the value with `useContext`. This solves prop drilling, but Context has a performance characteristic that matters at scale.

---

## Section 1: Why React Context Doesn't Scale for Frequently-Changing State

React Context re-renders **every component that calls `useContext`** whenever any value in the context changes. If you put `{ user, isAuthenticated, isModalOpen, sidebarExpanded, notifications }` in one context, every component consuming that context re-renders every time any of those values changes — even if that specific component only cares about `user`.

```typescript
// Context approach — the whole tree re-renders when any field changes
const AuthContext = createContext<AuthState>({ user: null, isAuthenticated: false });

function NavBar() {
  const { isAuthenticated } = useContext(AuthContext);
  // Re-renders whenever user, isAuthenticated, OR any other field in AuthContext changes
}
```

You can split contexts to work around this — one for auth, one for UI state, one for modals. But then you're manually implementing what Zustand provides out of the box: a store where each component subscribes to only the slice it needs.

---

## Section 2: Zustand's Model — State Outside the Tree

Zustand creates a store that lives entirely **outside the React component tree**. It is not a provider or a context. Any component anywhere calls the store hook directly:

```typescript
// Any component — no Provider required, no prop drilling
import { useAuthStore } from '@/stores/auth.store';

function NavBar() {
  const user = useAuthStore((state) => state.user);
  return <span>{user?.email}</span>;
}
```

When `user` changes in the store, `NavBar` re-renders. When `isAuthenticated` changes, `NavBar` does not re-render — it only subscribed to `user`. This per-selector subscription is the core difference from Context.

---

## Section 3: Creating a Store

`create` from Zustand takes a function that receives `set` and returns the initial state and actions as a single object:

```typescript
// stores/auth.store.ts
import { create } from 'zustand';
import { clearAccessToken, setAccessToken } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionStatus: 'FREE' | 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user, accessToken) => {
    setAccessToken(accessToken);
    document.cookie = '_gl_session=1; path=/; max-age=604800; SameSite=Lax';
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    clearAccessToken();
    document.cookie = '_gl_session=; path=/; max-age=0; SameSite=Lax';
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));
```

Three design decisions to understand:

**`set` does a shallow merge, not a replacement.** `set({ user, isAuthenticated: true })` merges only the specified keys into the existing state — it does not wipe out `logout` or `setUser`. You only pass the keys you want to change.

**Actions live alongside state.** `login`, `logout`, and `setUser` are defined inside the same `create` call as `user` and `isAuthenticated`. This is the Zustand convention: all operations on a piece of state live in one file. No action creators scattered in separate files, no external mutation functions.

**Actions can have side effects.** Zustand actions are plain functions. `login` calls `setAccessToken` (updates the in-memory JWT variable in `lib/api.ts`) and writes a cookie before calling `set`. The store is the coordinator — it handles everything that must happen atomically when a user logs in.

---

## Section 4: Reading State — Selectors

A selector is the function you pass to `useAuthStore`. It picks the slice of state you need. The component only re-renders when the selected value changes:

```typescript
// Wrong — subscribes to the entire store, re-renders on any change
const store = useAuthStore();
const user = store.user;

// Correct — subscribes only to user, re-renders only when user changes
const user = useAuthStore((state) => state.user);
```

This distinction matters when the store grows. If `useUiStore` holds sidebar state, modal state, and notification counts, a component that only needs to know whether a modal is open should not re-render when the sidebar is toggled. Selectors enforce this at the component level.

### Selecting Multiple Values

For multiple values from the same store, the cleanest pattern in this codebase is multiple individual calls:

```typescript
// Clean — each subscription is independent
const user = useAuthStore((state) => state.user);
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
```

Actions (like `logout`) are referentially stable in Zustand — they're defined once and don't change between renders. You can safely destructure them without a selector:

```typescript
// Actions are stable — destructuring without a selector is fine
const { login: saveSession } = useAuthStore();
```

---

## Section 5: What the Auth Store Holds and Why

### The `user` and `isAuthenticated` Fields

`user: AuthUser | null` holds the full user object returned by the login API. `null` means no authenticated user. `isAuthenticated: boolean` is set together with `user` so they are always in sync — there's no state where `user` is set but `isAuthenticated` is false, or vice versa.

```typescript
// Both are always updated together — one call to set
set({ user, isAuthenticated: true });   // login
set({ user: null, isAuthenticated: false });  // logout
```

### The `login` Action — Three Things at Once

```typescript
login: (user, accessToken) => {
  setAccessToken(accessToken);
  document.cookie = '_gl_session=1; path=/; max-age=604800; SameSite=Lax';
  set({ user, isAuthenticated: true });
},
```

**`setAccessToken(accessToken)`** — stores the JWT in a module-level variable in `lib/api.ts`. The Axios request interceptor reads this variable and attaches the token as a `Bearer` header on every subsequent API request. The token is never stored in `localStorage` or a cookie — it lives in JavaScript memory, which disappears on page reload (the refresh token flow handles re-establishing the session).

**Setting `_gl_session`** — writes a cookie that the Next.js middleware can read. See Section 6 for the full explanation.

**`set({ user, isAuthenticated: true })`** — updates the store, triggering re-renders in all components subscribed to `user` or `isAuthenticated`.

### The `logout` Action — Reverses All Three

```typescript
logout: () => {
  clearAccessToken();
  document.cookie = '_gl_session=; path=/; max-age=0; SameSite=Lax';
  set({ user: null, isAuthenticated: false });
},
```

`clearAccessToken()` removes the JWT from memory. Setting `_gl_session` with `max-age=0` instructs the browser to delete the cookie immediately. `set({ user: null, ... })` clears the auth state.

### The `setUser` Action — Partial Updates

```typescript
setUser: (user) => set({ user }),
```

Used after onboarding completion to flip `user.onboardingCompleted` to `true` without a logout/login cycle. The API returns the updated user object; `setUser` puts it in the store so all components reading `user.onboardingCompleted` see the new value immediately:

```typescript
// hooks/use-onboarding.ts — after POST /onboarding/complete
onSuccess: (response) => {
  if (user) {
    setUser({ ...user, onboardingCompleted: true });
  }
  router.replace('/dashboard');
},
```

---

## Section 6: The `_gl_session` Cookie — Client State That Crosses to the Server

### The Problem

Next.js middleware runs on the **Edge Runtime** before any React code executes. Its job is to redirect unauthenticated users away from protected routes. To do this, it needs to know whether the current user is authenticated.

But the auth state lives in Zustand — JavaScript memory in the browser. The middleware runs on the server; it cannot read browser JavaScript memory.

The real security token — the refresh token — is HTTP-only on the API origin (`localhost:3000`). HTTP-only means JavaScript cannot read it. It is also scoped to the API origin, so the browser does not send it with requests to the Next.js server on `localhost:3001`.

```typescript
// Wrong — middleware tries to read the access token, which it can't reach
const token = request.cookies.get('accessToken'); // undefined — not in a cookie at all
```

### The Solution: A Session Indicator Cookie

The auth store sets a separate, non-HTTP-only cookie on the **frontend origin** when the user logs in:

```typescript
document.cookie = '_gl_session=1; path=/; max-age=604800; SameSite=Lax';
```

Because it's not HTTP-only and is set on the frontend origin, the browser sends it with every request to the Next.js server. The middleware can read it:

```typescript
// middleware.ts
const hasSession = request.cookies.has('_gl_session');
```

`_gl_session=1` is not a security token. It cannot be used to make authenticated API requests. Its only purpose is to tell the Next.js router whether to show a protected page or redirect to `/login`. The actual security enforcement happens at the API layer — every protected endpoint validates the JWT.

### Why This Is the Correct Architecture

The alternative — calling the backend API from middleware to verify the token on every page load — would add 50-200ms of latency to every navigation. The Edge Runtime is designed for fast, lightweight decisions. Cookie reads are free; API calls are not.

The `_gl_session` pattern is a standard solution for this architectural constraint. The security model remains correct: `_gl_session` being present doesn't grant API access. An attacker who sets their own `_gl_session=1` cookie can reach the dashboard page, but every API call from that page will be rejected with a 401 because they have no valid JWT.

---

## Section 7: Client State vs Server State — The Most Important Distinction

This is the architectural decision that prevents the most common React mistakes.

| | Client state | Server state |
|---|---|---|
| What it is | State the application owns and controls | Data that lives in a database, fetched over a network |
| Where it lives | Zustand | React Query |
| Source of truth | The application | The API / database |
| Examples | Current user, sidebar open, modal state | Categories list, entries, user profile from API |
| Lifetime | Until page reload or explicit reset | Until cache expires or is invalidated |

**The mistake:** storing API responses in Zustand.

```typescript
// Wrong — API data in Zustand
const useStore = create<State>((set) => ({
  categories: [],
  fetchCategories: async () => {
    const data = await api.get('/categories');
    set({ categories: data });
  },
}));

function CategoriesList() {
  const categories = useStore((state) => state.categories);
  const fetchCategories = useStore((state) => state.fetchCategories);

  useEffect(() => {
    void fetchCategories(); // manual fetch on mount
  }, [fetchCategories]);
}
```

This reimplements a bad version of a cache: no deduplication (two components calling `fetchCategories` fire two requests), no background refetching, no loading/error states, no invalidation (after creating a category, the list is stale with no mechanism to refresh it), and no `staleTime` (every mount refetches).

```typescript
// Correct — API data in React Query
function CategoriesList() {
  const { data: categories, isLoading, isError } = useCategories();
  // Automatic deduplication, caching, background refetch, loading/error states
}
```

Zustand holds state the application creates: who is logged in, what the UI is doing. React Query holds state the database holds and the application reads.

---

## How the Auth Store Fits in the Application

```
User submits login form
    ↓
loginMutation.mutate(values)         ← React Query mutation
    ↓
POST /auth/login → { user, accessToken }
    ↓
onSuccess: saveSession(user, accessToken)    ← calls useAuthStore.login
    ↓
setAccessToken(accessToken)          ← JWT stored in lib/api.ts memory
_gl_session=1 cookie set             ← middleware can now read this
set({ user, isAuthenticated: true }) ← store updated
    ↓
All subscribed components re-render with new user
NavBar shows user email
AuthGuard stops redirecting
    ↓
router.replace('/dashboard')
    ↓
Middleware runs on /dashboard request
reads _gl_session cookie → hasSession = true
calls NextResponse.next() → page renders
```

Zustand coordinates a moment in time (the login) that has three simultaneous effects: memory state, cookie state, and React state. React Query handles the async operation and its lifecycle. The router handles navigation. Each layer has one responsibility.
