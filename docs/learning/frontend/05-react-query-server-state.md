# 05 — React Query: Server State and the API Layer

**Phase:** F01–F05 | **Concepts:** server state properties, `QueryClient`, `useQuery`, `useMutation`, query keys, cache invalidation, `enabled` flag, `staleTime`, Axios interceptors, token refresh

---

## Why Server State Needs Its Own System

Server state has properties that make it fundamentally different from local UI state, and those properties are exactly what makes managing it with `useState` fragile.

**It is asynchronous.** There is always a loading period, and there is always the possibility of failure. Every piece of server state needs three states: loading, success, and error.

**It can be stale.** The category list you fetched 60 seconds ago may not reflect what is in the database now — another browser tab might have added a new category. Local state (`useState`) has no concept of staleness.

**It is often shared.** The category list is needed in the onboarding wizard (`onboarding-step1.tsx`) and potentially in a sidebar widget. Without a cache, each component fetches independently and deduplicates nothing.

**Mutations invalidate it.** When you create a category via a POST, the cached GET response is now wrong. Something has to be aware of this relationship and trigger a refetch.

The naive approach is `useEffect` + `useState`:

```typescript
// Wrong — manual server state management
function OnboardingStep1() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/categories')
      .then((r) => setCategories(r.data.data))
      .catch(() => setError('Failed to load categories'))
      .finally(() => setIsLoading(false));
  }, []);
}
```

Problems: no caching (every mount refetches), no background refetch, no deduplication (two components both run this effect independently), no automatic invalidation after mutation, manual loading/error tracking, and the `useEffect` pattern is explicitly flagged by the React Query ESLint plugin.

React Query is a cache specifically designed for server state. It handles all of this with a consistent API.

---

## Section 1: The `QueryClient` — The Global Cache

Everything in React Query lives inside a `QueryClient`. It is the in-memory cache that stores every fetched response, tracks freshness, and coordinates deduplication. One `QueryClient` is created per application run.

```typescript
// providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,  // data is fresh for 60 seconds
            retry: 1,              // retry once on failure before showing error state
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

### Why `useState` with a Factory Function

```typescript
// Wrong — new QueryClient (new empty cache) on every render
function QueryProvider({ children }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Correct — created once, stable across renders
const [queryClient] = useState(() => new QueryClient({ ... }));
```

`useState(() => new QueryClient(...))` passes a factory function. React calls it once to compute the initial state, then ignores it on re-renders. The `QueryClient` is created exactly once per application session.

The `@tanstack/query/stable-query-client` ESLint rule enforces this pattern — it catches `new QueryClient()` in the render body before it can cause bugs.

### `staleTime` — How Long Data Is Fresh

After a query fetches data, React Query considers it "fresh" for `staleTime` milliseconds. During this window, if the same query key is used by another component, React Query returns the cached value without making a network request. After the window expires, the data is "stale" and will be refetched in the background when the query is next used.

`staleTime: 60_000` means the category list is served from cache for up to 60 seconds. This prevents hammering the API when multiple components use the same data simultaneously.

---

## Section 2: `useQuery` — Fetching Data

`useQuery` fetches data and caches it by query key. It runs automatically when the component mounts (subject to `enabled`). It does not need to be triggered manually.

```typescript
// hooks/use-categories.ts
export function useCategories(): UseQueryResult<Category[], ApiError> {
  return useQuery<Category[], ApiError>({
    queryKey: ['categories'],
    queryFn: () =>
      api
        .get<{ data: Category[]; meta: { total: number } }>('/categories')
        .then((r) => r.data.data),
  });
}
```

The three generic types `useQuery<TData, TError>` tell TypeScript what `data` and `error` will be. Without them, `data` would be `unknown`.

`.then((r) => r.data.data)` unwraps the API envelope. The backend returns `{ data: Category[], meta: { total: number } }`. React Query caches `r.data.data` — the actual array — not the full envelope.

### Handling All Three States

A component must handle loading, error, and empty states explicitly. Rendering `undefined` or skipping the loading state creates broken UI:

```typescript
// Wrong — renders nothing while loading, crashes if data is undefined
function CategoryList() {
  const { data } = useCategories();
  return <ul>{data.map(...)}</ul>;  // TypeError: cannot read map of undefined
}

// Correct — explicit state for each phase
function CategoryList() {
  const { data, isLoading, isError } = useCategories();

  if (isLoading) return <CategoryListSkeleton />;
  if (isError) return <ErrorMessage message="Failed to load categories." />;
  if (!data?.length) return <EmptyState message="No categories yet." />;

  return (
    <ul>
      {data.map((category) => (
        <CategoryItem key={category.id} category={category} />
      ))}
    </ul>
  );
}
```

`isLoading` is `true` only on the **first** fetch — when there's no cached data. On background refetches (after navigating away and back), `isLoading` is `false` and `isFetching` is `true`. This distinction matters: `isFetching` should update a subtle indicator; `isLoading` should show a full skeleton. Don't conflate them.

---

## Section 3: Query Keys — The Cache Identity System

### What a Query Key Is

The query key is the address of a cache entry. React Query uses it to:
- **Identify** cached data (is this request already in the cache?)
- **Deduplicate** requests (two components with the same key share one fetch)
- **Target invalidation** (after a mutation, which cache entries need to be refreshed?)

Query keys are arrays. React Query compares them by deep equality.

```typescript
// These are different cache entries — different parameters, different results
queryKey: ['categories']                      // all categories for the user
queryKey: ['categories', 'c-1']              // one category with ID 'c-1'
queryKey: ['entries', { page: 1, limit: 10 }] // page 1 of entries
queryKey: ['entries', { page: 2, limit: 10 }] // page 2 — different entry
```

### Deduplication in Practice

When `OnboardingStep1` and a hypothetical sidebar widget both call `useCategories()` (same query key `['categories']`):
- React Query sees both requests have the same key
- It fires **one** network request
- Both components receive the same cached response when it arrives
- When the cache updates, both components re-render with the new data

This deduplication is automatic and requires no configuration.

### Invalidation Hierarchy

Query key arrays form a hierarchy. Invalidating a prefix invalidates all matching entries:

```typescript
// Invalidating 'categories' invalidates all of these:
queryKey: ['categories']                 // list
queryKey: ['categories', 'c-1']         // individual item
queryKey: ['categories', 'c-2']         // another individual item
```

```typescript
// hooks/use-categories.ts — after creating a category
onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: ['categories'] });
},
```

After a successful POST to `/categories`, `invalidateQueries` marks all `['categories']` entries as stale and triggers a background refetch. Every component subscribed to any `['categories']` key receives the updated data — including the new category — without the component needing to know a mutation happened.

### The `@tanstack/query/exhaustive-deps` Rule

All reactive values used inside `queryFn` must appear in `queryKey`. This is enforced by the ESLint plugin:

```typescript
// Bug — filters change but queryKey doesn't → stale data returned from cache
function useEntries(filters: EntryFilters) {
  return useQuery({
    queryKey: ['entries'],                          // Missing filters
    queryFn: () => api.get('/entries', { params: filters }),
  });
}

// Correct — all queryFn inputs are in queryKey → refetch when filters change
function useEntries(filters: EntryFilters) {
  return useQuery({
    queryKey: ['entries', filters],
    queryFn: () => api.get('/entries', { params: filters }),
  });
}
```

---

## Section 4: `useMutation` — Write Operations

`useMutation` handles POST, PATCH, and DELETE requests. Unlike `useQuery`, it does not run automatically — it runs when `.mutate()` is called explicitly:

```typescript
// hooks/use-categories.ts
export function useCreateCategory(): UseMutationResult<Category, ApiError, CreateCategoryDto> {
  const queryClient = useQueryClient();
  return useMutation<Category, ApiError, CreateCategoryDto>({
    mutationFn: (body) =>
      api
        .post<{ data: Category; meta: Record<string, never> }>('/categories', body)
        .then((r) => r.data.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
```

The three generic types `useMutation<TData, TError, TVariables>`:

| Generic | What it types | In this hook |
|---|---|---|
| `TData` | What the mutation resolves to | `Category` — the created object |
| `TError` | What the mutation rejects with | `ApiError` |
| `TVariables` | The argument to `.mutate()` | `CreateCategoryDto` — the POST body |

### Calling `.mutate()` in a Component

```typescript
// Inside onboarding-step1.tsx
const createCategory = useCreateCategory();

function handleSuggestionClick(name: string, color: string): void {
  createCategory.mutate(
    { name, color },
    {
      // Component-level callbacks supplement the hook's default handlers
      onSuccess: (newCategory) => {
        // newCategory is Category — the server response, fully typed
        // The cache was already invalidated by the hook's onSuccess
        // Here we handle UI-specific behaviour after creation
      },
    },
  );
}
```

The hook's `onSuccess` (cache invalidation) and the component's `onSuccess` (UI update) both run. The hook handles global behaviour; the component handles local behaviour. `createCategory.isPending` is `true` while the request is in flight:

```typescript
<button
  onClick={handleSuggestionClick}
  disabled={createCategory.isPending}
>
  Add category
</button>
```

---

## Section 5: The `enabled` Flag — Conditional Queries

`useQuery` fires immediately on mount by default. The `enabled` flag prevents it from firing until a condition is met:

```typescript
// hooks/use-auth.ts
export function useVerifyEmail(token: string): UseQueryResult<VerifyEmailResponse, ApiError> {
  return useQuery<VerifyEmailResponse, ApiError>({
    queryKey: ['auth', 'verify-email', token],
    queryFn: () =>
      api.post<VerifyEmailResponse>('/auth/verify-email', { token }).then((r) => r.data),
    enabled: !!token,      // only run when token is a non-empty string
    retry: false,          // bad tokens will always fail — don't retry
    staleTime: Infinity,   // email verification is one-time — never refetch
  });
}
```

Without `enabled: !!token`, the query would fire with an empty string on the first render (before the token is read from the URL). The API would receive an empty token and return a 400 or 401. The component would briefly show an error state before the token loads and the real query fires.

`staleTime: Infinity` overrides the global 60-second default — a verified email token response is permanent and never needs to be refetched. `retry: false` means don't retry — a wrong or expired token will always fail, and retrying wastes requests.

---

## Section 6: The Axios Layer

React Query handles the cache and lifecycle, but it delegates the actual HTTP requests to `lib/api.ts` — an Axios instance configured with a base URL and two interceptors.

### The Axios Instance

```typescript
// lib/api.ts
export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,   // http://localhost:3000/api/v1
  withCredentials: true,              // sends cookies with every request
});
```

`withCredentials: true` instructs the browser to include cookies in cross-origin requests. This is required for the HTTP-only `refresh_token` cookie to be sent to the backend API even though it runs on a different port than the frontend.

### The Request Interceptor — Attaching the JWT

```typescript
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Every request is intercepted before it leaves the browser. `getAccessToken()` reads the in-memory variable set by `useAuthStore.login`. If a token exists, it's attached as a `Bearer` header. This is transparent to all hooks and components — they call `api.get()` or `api.post()` without thinking about authentication headers.

### The Response Interceptor — Silent Token Refresh

Access tokens expire after 1 hour. Without automatic refresh, every component would need to handle 401 responses and trigger a token refresh. The response interceptor does this transparently:

```typescript
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPublicAuth = PUBLIC_AUTH_PATHS.some((p) => originalRequest.url?.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuth) {
      originalRequest._retry = true;

      try {
        // Calls the refresh endpoint — the browser sends the HTTP-only refresh_token cookie
        await axios.post(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, { withCredentials: true });
        // Re-run the original request — the new access token is now in the response cookie
        return api(originalRequest);
      } catch {
        clearAccessToken();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);
```

The flow when a token expires mid-session:

```
Component calls useCategories()
    ↓
api.get('/categories') fires
    ↓
Backend returns 401 (token expired)
    ↓
Response interceptor catches the 401
    ↓
originalRequest._retry = true  (prevents infinite retry loop)
    ↓
POST /auth/refresh fires
Browser sends HTTP-only refresh_token cookie automatically
Backend validates it, issues new access token (not visible to JS — it stays in memory)
    ↓
Original GET /categories re-fires with the new token
    ↓
200 response → React Query cache updated → component re-renders with data
```

Components see only the successful final response. The token expiry and refresh happen silently between the request and the response.

`isPublicAuth` is a guard that prevents the refresh loop from triggering on login, register, and refresh endpoints. A 401 from these endpoints is intentional (wrong credentials, invalid token) — it must reach the caller, not trigger a refresh.

---

## How the Three Layers Compose

Every API-backed component in this project uses the same three-layer stack:

```
Component
    ↓ imports hook
Custom hook (src/hooks/use-*.ts)
    queryFn: () => api.get(...).then(...)
    mutationFn: (body) => api.post(...).then(...)
    onSuccess: queryClient.invalidateQueries(...)
    onError: toast.error(...)
    ↓ calls
Axios instance (src/lib/api.ts)
    Request interceptor: attaches JWT
    Response interceptor: silent token refresh on 401
    baseURL: env.NEXT_PUBLIC_API_URL
    ↓ network request
Backend API (NestJS — apps/api)
    Returns { data: T, meta: { ... } }
    ↓ response
React Query cache
    Stores the unwrapped data (r.data.data)
    Serves from cache on subsequent calls
    Invalidates on mutation
    ↓ re-renders subscribed components
```

Components never import `axios` directly. The hook is the contract: it hides the HTTP method, the URL, the envelope unwrapping, and error handling. The hook is the only place where the API's response shape is known and translated into a typed value. Components receive typed data from the hook and render it — they don't know or care how it was fetched.
