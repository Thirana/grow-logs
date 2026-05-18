# 02 — Next.js App Router: Routing, Layouts, and Route Groups

**Phase:** F01–F05 | **Concepts:** App Router architecture, route groups, nested layouts, Server Components, pages as leaf nodes, `next/link`, `next/navigation`, `useSearchParams`, Suspense

---

## Why Next.js Uses a File-System Router

Most web frameworks separate routing configuration from the file system. You write a routing object — a map of URL patterns to handler functions — and the framework reads it at startup:

```typescript
// A traditional routing config — common in Express, React Router, etc.
const routes = [
  { path: '/login',     component: LoginPage },
  { path: '/dashboard', component: DashboardPage },
  { path: '/categories', component: CategoriesPage },
];
```

This approach requires you to maintain two things in sync: the routing config and the actual files. If you add a new page file but forget the route entry, the page is unreachable. If you rename a route but forget the file, the route 404s.

Next.js takes the opposite approach: **the folder structure is the routing config**. Every folder inside `app/` whose path contains a `page.tsx` becomes a URL route. Delete the file, the route disappears. Move the file, the URL changes. There is nothing to keep in sync because there is only one thing.

The tradeoff is that you have less flexibility — the URL structure is determined by the folder structure, not an arbitrary mapping. In practice this is almost always fine, and the route groups feature (covered below) solves the cases where it would be limiting.

---

## The Four Reserved File Types

Not every file in `app/` becomes a route. Next.js recognises four reserved file names that each play a distinct, non-overlapping role:

| File | Purpose | Renders when |
|---|---|---|
| `page.tsx` | The unique UI for that URL | Every request to that URL |
| `layout.tsx` | A persistent shell wrapping child pages | On first visit; then persists across navigations in its subtree |
| `loading.tsx` | A Suspense fallback for the route | While the page is streaming or suspended |
| `error.tsx` | An Error Boundary for the route | When the page throws an unhandled error |

A critical rule: **only `page.tsx` makes a route publicly accessible**. A folder with only a `layout.tsx` has no URL. This is intentional — route groups use this to share a layout across pages without the group folder itself becoming a route.

Any other file name (component files, hook files, utility files) inside `app/` is ignored by the router. You can co-locate components with the page that uses them, which keeps related code together without accidentally exposing them as routes.

---

## Section 1: Route Groups

### The Problem They Solve

Without route groups, shared layouts are tied to URL structure. If you want `/login`, `/register`, and `/verify-email` to share the same two-column brand-panel layout, you have two options:

**Option A — Nest them under an `auth/` folder:**
```
app/
  auth/
    layout.tsx    ← shared layout
    login/page.tsx     → URL: /auth/login
    register/page.tsx  → URL: /auth/register
```
This works, but the URLs now have `/auth/` in them — which you didn't want.

**Option B — Copy the layout into each folder:**
```
app/
  login/
    layout.tsx    ← copy of the layout
    page.tsx      → URL: /login
  register/
    layout.tsx    ← another copy of the layout
    page.tsx      → URL: /register
```
This works without the URL prefix, but the layout is duplicated and will drift out of sync.

Route groups solve this with a third option that has neither problem.

### How Route Groups Work

Wrapping a folder name in parentheses creates a **route group**. A route group is invisible to the URL — it organises files in the filesystem without adding a URL segment:

```
app/
  (auth)/
    layout.tsx          ← shared layout — no URL segment added
    login/
      page.tsx          → URL: /login
    register/
      page.tsx          → URL: /register
    verify-email/
      page.tsx          → URL: /verify-email
```

The `(auth)` folder contributes zero characters to any URL. Its only role is to define the boundary of a `layout.tsx`. Every `page.tsx` inside the group inherits that layout. Pages in different groups get different layouts, even when their URLs would be siblings at the same level.

### Route Groups in This Project

This project uses three route groups, each with a distinct layout:

```
app/
  (auth)/
    layout.tsx        ← two-column shell: brand panel left, form right
    login/page.tsx
    register/page.tsx
    verify-email/page.tsx
    check-email/page.tsx

  (dashboard)/
    layout.tsx        ← wraps every page in <AuthGuard>
    dashboard/page.tsx
    categories/page.tsx

  (onboarding)/
    layout.tsx        ← wizard shell with category preview panel
    onboarding/page.tsx
```

Without route groups, there would be no clean way to share three different layouts across these three groups of pages without either polluting the URLs or duplicating layout code.

---

## Section 2: Layouts

### What a Layout Is

A layout is a component that **persists across navigations within its subtree**. When the user navigates from `/dashboard` to `/categories`, the `(dashboard)/layout.tsx` does not unmount and remount — only the page component inside it swaps. This is how a sidebar, top bar, or brand panel stays stable while the main content changes, without any special animation or state management.

Every layout receives a `children` prop. The `children` is whatever comes next in the nesting hierarchy — either another layout or a page:

```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <BrandPanel />          {/* renders for login, register, and verify-email */}
      <div className="flex-1">
        {children}            {/* swaps: LoginForm, RegisterForm, or VerifyEmailContent */}
      </div>
    </div>
  );
}
```

`BrandPanel` is rendered once when the user first visits an auth page and persists for the duration — it doesn't re-render when the user navigates from `/login` to `/register`. The `children` slot is where Next.js substitutes the current page's content.

### Layout Nesting

Layouts compose automatically based on the folder hierarchy. The root `app/layout.tsx` wraps everything. Group layouts wrap their subtree. Page components are the innermost element:

```
app/
  layout.tsx              ← 1. always renders (QueryProvider, toast)
  (dashboard)/
    layout.tsx            ← 2. renders inside root (AuthGuard)
    dashboard/
      page.tsx            ← 3. renders inside both
```

When a user visits `/dashboard`, React renders this tree:

```typescript
<RootLayout>               // QueryProvider, Toaster
  <DashboardLayout>        // AuthGuard — redirects if not authenticated
    <DashboardPage />      // the actual page content
  </DashboardLayout>
</RootLayout>
```

Next.js constructs this tree automatically from the folder structure. You don't write this nesting explicitly — each layout's `{children}` slot is where the next level is substituted.

### The Root Layout Is Special

`app/layout.tsx` must include `<html>` and `<body>` tags — it's the outermost HTML document. This is also where providers that need to wrap the entire application are placed:

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>   {/* React Query cache — available everywhere */}
          {children}
          <Toaster />     {/* Sonner toast container — available everywhere */}
        </QueryProvider>
      </body>
    </html>
  );
}
```

`QueryProvider` and `Toaster` go here — not in every page — because they need to be present on every route in the application.

---

## Section 3: Pages — Intentionally Thin

A `page.tsx` is the leaf node of the routing tree. Its only job is to render the unique content for its URL. In this project, pages are intentionally thin — they delegate all real logic to feature components:

```typescript
// app/(auth)/login/page.tsx
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

This page does three things: renders `LoginForm`, wraps it in `Suspense` (required because `LoginForm` reads the query string — covered in the Suspense section below), and nothing else. All data fetching, form handling, and event logic lives in `LoginForm`. The page is the connector, not the implementation.

This pattern keeps pages readable at a glance. You can open any page and immediately understand what it renders without reading through business logic.

---

## Section 4: Server Components vs Client Components

### The Default: Server Components

The App Router defaults to **Server Components**. A Server Component renders on the server — its JSX is computed, converted to a lightweight serialised format, and sent to the browser as already-rendered HTML. The browser receives the rendered output with no JavaScript bundle for that component.

The practical consequence: Server Components have zero cost in the JavaScript bundle. They never become part of the code the browser downloads, parses, and executes.

**Server Components cannot use:**

| Forbidden | Why |
|---|---|
| `useState`, `useReducer`, `useRef` | React state runs in the browser, not the server |
| `useEffect`, `useLayoutEffect` | Effects run after DOM mount — no DOM on the server |
| `onClick`, `onChange`, event handlers | Events are browser concepts |
| `window`, `document`, `localStorage` | Browser APIs unavailable on the server |
| React Query hooks (`useQuery`, useMutation`) | They use browser APIs internally |

**Server Components can:**
- Be `async` and `await` data fetches directly
- Import Server Components and Client Components
- Access environment variables and secrets that must never reach the browser

### Adding `'use client'` — Making a Client Component

Placing `'use client'` at the top of a file marks it and everything it imports as a **Client Component**. Client Components are bundled into JavaScript and sent to the browser, where they hydrate and become interactive:

```typescript
// Wrong — 'use client' on the page, even though only LoginForm is interactive
'use client';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

```typescript
// Correct — page stays a Server Component, only LoginForm is marked client
// (no 'use client' on LoginPage)

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />   // LoginForm has 'use client' at the top of its own file
    </Suspense>
  );
}
```

The wrong version sends the entire page — including the Suspense wrapper — as JavaScript to the browser, even though none of that code needs to be interactive. The correct version sends only `LoginForm` as client JavaScript.

### The "Push the Client Boundary Down" Rule

`'use client'` propagates downward through imports. Every component imported by a client component is treated as client code, even without its own `'use client'` directive. This means the directive should be placed **as far down the tree as possible**, so the maximum amount of code stays server-only.

```
app/(auth)/login/page.tsx       ← Server Component (no 'use client')
  └── Suspense                  ← Server Component (built-in React)
        └── LoginForm           ← 'use client' (uses hooks and event handlers)
              └── Field         ← becomes client code (imported by LoginForm)
              └── PasswordInput ← becomes client code (imported by LoginForm)
```

`LoginForm` must be a client component because it uses `useForm`, `useState`, `useRouter`, and event handlers. The `Field` and `PasswordInput` sub-components are pulled into client code because they're imported from within `LoginForm`.

In this project: all layouts are Server Components. The `'use client'` directive appears only in components that use hooks or event handlers: form components, the auth guard, and the onboarding wizard.

---

## Section 5: Navigation

### `next/link` for Declarative Navigation

`<Link>` is Next.js's replacement for `<a>`. The critical difference: `<a>` triggers a full page reload, which re-initialises the JavaScript runtime, re-creates the React tree from scratch, and loses all in-memory state. `<Link>` performs client-side navigation — it fetches only the new page's content, swaps it into the existing React tree, and preserves all in-memory state.

```typescript
// Wrong — full page reload on every click
<a href="/register">Sign up</a>

// Correct — client-side navigation, no page reload
<Link href="/register">Sign up</Link>
```

`<Link>` also prefetches the target page when it scrolls into the viewport — the next page's data and code are loaded in the background while the user is still reading the current page. Navigation then feels instant because the data is already local.

With `typedRoutes: true` enabled, `href` is typed to only accept valid routes in the application:

```typescript
// TypeError at compile time — '/regsiter' is not a known route
<Link href="/regsiter">Sign up</Link>

// Compiles correctly
<Link href="/register">Sign up</Link>
```

This catches dead links at build time. When a route is renamed or deleted, every `<Link>` pointing to it becomes a compile error.

### `useRouter` for Programmatic Navigation

`useRouter` from `next/navigation` gives you the router object for navigation triggered by code — not by the user clicking a link. It is a hook, so it can only be used inside Client Components:

```typescript
// Inside LoginForm — a Client Component
const router = useRouter();

// After successful login:
void router.replace('/dashboard');  // replace history entry
void router.push('/settings');      // add new history entry
```

The difference between `replace` and `push` is browser history:

| Method | Effect on history | When to use |
|---|---|---|
| `router.replace` | Overwrites the current entry — Back button skips it | After login, after onboarding completion, post-form-submission landing |
| `router.push` | Adds a new entry — Back button returns to previous page | Deliberate navigation: settings, sidebar links, detail views |

After login, `router.replace` is the correct choice. If `router.push` were used, the user could press Back, land on the login page, and be immediately redirected to the dashboard again — an infinite loop in the browser history.

---

## Section 6: The `useSearchParams` + Suspense Pattern

`useSearchParams()` reads the current URL's query string (`?key=value`) in a Client Component. Next.js has a strict requirement: **any component that uses `useSearchParams` must be wrapped in a `<Suspense>` boundary in its parent server page**.

Why: Next.js pre-renders pages at build time when possible. During build-time rendering, the query string is unknown — it depends on what the user types into the browser. `useSearchParams` is inherently dynamic. Suspense is the signal to Next.js that says "this component's rendering depends on dynamic data — don't try to pre-render it; defer it to request time." Without Suspense, the build fails with a Next.js error.

```typescript
// Wrong — LoginForm uses useSearchParams but has no Suspense boundary
// This causes a build error: "useSearchParams() should be wrapped in a suspense boundary"
export default function LoginPage() {
  return <LoginForm />;
}
```

```typescript
// Correct — Suspense tells Next.js to defer LoginForm until runtime
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

In the login form, `useSearchParams` reads the `?next=` redirect parameter that middleware sets when redirecting unauthenticated users:

```typescript
// components/auth/login-form.tsx — Client Component
const searchParams = useSearchParams();
const next = searchParams.get('next');  // e.g. '/dashboard' from ?next=%2Fdashboard

// After successful login:
const fallback = data.user.onboardingCompleted ? '/dashboard' : '/onboarding';
void router.replace((next ?? fallback) as Parameters<typeof router.replace>[0]);
```

The user tried to go to `/dashboard`, middleware redirected them to `/login?next=%2Fdashboard`, the login form reads `next`, and after login redirects them back to `/dashboard`. Without `useSearchParams`, this redirect chain couldn't be completed.

---

## How the App Router Shapes This Application's URLs

| URL | Route group | Layouts rendered (in order) | Page file |
|---|---|---|---|
| `/login` | `(auth)` | Root → Auth | `(auth)/login/page.tsx` |
| `/register` | `(auth)` | Root → Auth | `(auth)/register/page.tsx` |
| `/verify-email` | `(auth)` | Root → Auth | `(auth)/verify-email/page.tsx` |
| `/dashboard` | `(dashboard)` | Root → Dashboard | `(dashboard)/dashboard/page.tsx` |
| `/categories` | `(dashboard)` | Root → Dashboard | `(dashboard)/categories/page.tsx` |
| `/onboarding` | `(onboarding)` | Root → Onboarding | `(onboarding)/onboarding/page.tsx` |

The route group names `(auth)`, `(dashboard)`, and `(onboarding)` never appear in any URL. They exist purely to define layout boundaries in the filesystem.

---

## How It All Fits Together

```
User visits /dashboard

Next.js file system router
  Reads: app/(dashboard)/dashboard/page.tsx exists
  Layouts: app/layout.tsx, app/(dashboard)/layout.tsx
  Matcher in middleware.ts fires

     Middleware (edge runtime — before React)
          Checks _gl_session cookie
          No cookie → redirects to /login?next=%2Fdashboard
          Cookie present → calls NextResponse.next()
               ↓
     Layout tree builds
          <RootLayout>            ← QueryProvider, Toaster
            <DashboardLayout>     ← AuthGuard (client component, reads auth store)
              <DashboardPage />   ← Server Component, renders feature components
            </DashboardLayout>
          </RootLayout>
               ↓
     Feature components
          Client Components call useQuery hooks
          React Query fetches from API, caches response
          Component re-renders with data
```

Each layer of the App Router — file-system routing, route groups, layouts, pages, Server/Client split — solves one specific problem. Route groups keep layout sharing from polluting URLs. Layouts keep shared UI stable across navigation. The Server/Client boundary keeps the JavaScript bundle small. Navigation hooks handle both declarative and programmatic routing. The Suspense pattern bridges static pre-rendering with dynamic URL data.
