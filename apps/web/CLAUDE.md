# apps/web/CLAUDE.md

This file is loaded automatically alongside the root `CLAUDE.md` whenever Claude Code operates inside `apps/web/`.
It covers all frontend-specific conventions, architecture rules, and engineering standards.

---

## Frontend Engineering Standard

The same bar applies as the backend: every decision should meet "would a senior engineer at a real SaaS company be comfortable shipping this?"

- Mobile-first always — design for the smallest screen first, then scale up
- Server Components by default — add `'use client'` only when genuinely needed
- No happy-path-only implementations — every async operation has loading, error, and empty states
- No premature abstractions — extract a component when the rule says to, not speculatively

### UI Quality Standard — Match the Landing Page

**Every UI screen must match the visual quality of the landing page.** This is a non-negotiable bar, not a stretch goal.

The landing page establishes the design language for the entire product. All subsequent screens (auth, onboarding, dashboard, settings) must feel like they belong to the same product.

**What this means in practice:**

- **Depth and layering** — use `bg-gl-surface` cards with `border-gl-border` and `shadow-gl` to lift elements off the page background. Inputs inside cards use `bg-gl-bg` so they appear recessed. Never place a form on a flat dark background with no visual container.
- **Ambient decoration** — add subtle radial gradient glows (`rgba(46,184,160,0.04–0.09)`) on feature panels and key backgrounds. Never leave large dark areas completely empty.
- **Typography** — headlines use `font-bold tracking-[-0.02em]` or tighter. Gradient text (`bg-gradient-to-r from-[#2EB8A0] to-[#7DDFD0] bg-clip-text text-transparent`) for primary taglines. Never use plain unstyled headings.
- **Colour tokens** — always use the GL token system (`text-gl-text`, `text-gl-text-muted`, `bg-gl-surface`, `border-gl-border`, etc.). Never hardcode hex values outside of decoration gradients.
- **Trust signals** — auth and onboarding pages include a trust badge pill (matching the landing page announcement pill style: `border-gl-border bg-gl-surface rounded-full` with a coloured label chip inside).
- **Product previews** — brand/side panels use a static mini version of a real product widget (entry card, stat widget, etc.) to reinforce what the product does. Never use abstract illustrations or placeholder text.
- **Buttons** — primary CTAs use `bg-gl-primary text-gl-primary-ink hover:bg-gl-primary-hover` with `font-semibold`. Secondary actions use muted text with `hover:underline`. Never use generic grey buttons for primary actions.
- **Spacing and proportion** — layouts use the same spacing scale as the landing page. Panels with a fixed side column use `lg:w-[440px] xl:w-[500px]`. Form cards use `p-6` or `p-7` with `rounded-2xl`.

**Reference implementation:** `app/(auth)/layout.tsx` and `components/auth/register-form.tsx` are the established pattern for auth screens. New screens should match this quality level.

---

## Folder Structure

```
apps/web/src/
  app/                        # Next.js App Router — routes only, no business logic
    (auth)/                   # Route group: login, register, verify-email
    (dashboard)/              # Route group: authenticated app pages
    layout.tsx                # Root layout with providers
    page.tsx                  # Landing page (public)
  components/
    ui/                       # shadcn primitives — never edit these directly
    common/                   # App-level reusable components (Navbar, Footer, Sidebar, etc.)
    <feature>/                # Feature-specific components (entries/, categories/, auth/)
  hooks/                      # Custom React hooks — one file per resource or concern
  stores/                     # Zustand stores — one file per domain
  providers/                  # Context/provider wrapper components
  lib/
    api.ts                    # Axios instance with JWT interceptor
    env.ts                    # Zod-validated environment variables
    utils.ts                  # shadcn cn() + shared utility functions
  types/                      # TypeScript interfaces not covered by packages/types
```

**Rules:**

- `app/` contains routes and layouts only — no data fetching logic, no business logic inline
- `components/ui/` is owned by shadcn — never modify files in this folder directly; add or override in `components/common/` or feature folders instead
- Every feature that has more than one component gets its own subfolder under `components/`

---

## Naming Conventions

| Thing              | Convention                    | Example                                   |
| ------------------ | ----------------------------- | ----------------------------------------- |
| Files              | `kebab-case.tsx`              | `entry-card.tsx`, `create-entry-form.tsx` |
| Components         | `PascalCase`                  | `EntryCard`, `CreateEntryForm`            |
| Hooks              | `use` prefix, camelCase       | `useEntries`, `useCreateEntry`            |
| Zustand stores     | `use` prefix + `Store` suffix | `useAuthStore`, `useUiStore`              |
| Types / interfaces | `PascalCase`                  | `EntryCardProps`, `ApiError`              |
| Route groups       | `(kebab-case)`                | `(auth)`, `(dashboard)`                   |
| Constants          | `UPPER_SNAKE_CASE`            | `MAX_CATEGORIES`, `DEFAULT_PAGE_SIZE`     |

---

## Component Rules

### Server vs Client

- Default to **Server Components** — no directive needed
- Add `'use client'` only when the component uses: hooks, browser APIs, event handlers, or state
- Push `'use client'` as far down the tree as possible — never make a whole page client-side just for one interactive element
- Never fetch data inside a Client Component directly — use React Query hooks instead

### When to Extract a Component

Extract into its own file when **any** of these are true:

- The UI block is used in more than one place
- The JSX in a single file exceeds ~50 lines
- The block has its own loading, error, or empty state
- The block is a distinct, named concept (e.g. `EntryCard`, `CategoryBadge`, `StatsWidget`)

Never define one component inside another component's function body. File-local helper components are acceptable only when they are purely presentational and under ~15 lines.

### Props

- Every component has an explicitly named props interface above it — never use implicit `{}` or inline anonymous types
- Never use `React.FC` — use explicit props with a named interface
- Explicit return type on every exported component and hook

```typescript
// correct
interface EntryCardProps {
  entry: Entry;
  onDelete?: (id: string) => void;
}

export function EntryCard({ entry, onDelete }: EntryCardProps): JSX.Element { ... }

// wrong
const EntryCard: React.FC<{ entry: Entry }> = ({ entry }) => { ... }
```

### Component Size

- A single component file should not exceed ~150 lines including imports
- If it does, split it — either extract sub-components or split into a parent + child files in the same feature folder

---

## Styling Rules

- **Mobile-first always** — write base styles for the smallest screen, then add `sm:`, `md:`, `lg:` overrides
- Use `cn()` from `@/lib/utils` for all conditional class names — never string concatenation
- Use semantic CSS variables for colors (`text-foreground`, `bg-background`, `text-muted-foreground`) — never hardcode `text-black` or `bg-white`
- No inline `style` props except for values that genuinely cannot be expressed in Tailwind (e.g. dynamic CSS custom properties)
- No custom CSS files unless a Tailwind limitation makes it genuinely impossible — and that case must be documented with a comment explaining why
- Spacing, sizing, and layout come from Tailwind tokens only — no magic pixel numbers

### Responsive Breakpoints

| Prefix | Min-width | Use for                      |
| ------ | --------- | ---------------------------- |
| (none) | 0px       | Mobile — always the base     |
| `sm:`  | 640px     | Large phones / small tablets |
| `md:`  | 768px     | Tablets                      |
| `lg:`  | 1024px    | Laptops                      |
| `xl:`  | 1280px    | Desktops                     |

---

## Data Fetching Rules

- All server state lives in **React Query** — not Zustand, not `useState` + `useEffect`
- All Zustand stores hold **client/UI state only** (auth user, sidebar open/closed, modal state, etc.)
- Every API resource has a dedicated custom hook in `src/hooks/`:

```typescript
// hooks/use-entries.ts
export function useEntries(params: PaginationParams) {
  return useQuery({
    queryKey: ['entries', params],
    queryFn: () => api.get('/entries', { params }).then((r) => r.data),
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEntryInput) => api.post('/entries', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entries'] }),
  });
}
```

- Never call `api.get()` or `api.post()` directly inside a component — always go through a hook
- Query keys follow a consistent hierarchy: `['resource']` for lists, `['resource', id]` for single items
- No `useEffect` for data fetching — that is what React Query is for

### Always Handle All States

Every component that shows async data must handle all three states explicitly:

```typescript
const { data, isLoading, isError } = useEntries(params);

if (isLoading) return <EntriesListSkeleton />;
if (isError) return <ErrorMessage message="Failed to load entries." />;
if (!data?.length) return <EmptyState ... />;
return <EntriesList entries={data} />;
```

No silent failures. No rendering `undefined` without a guard.

---

## Shared Packages

The monorepo has two shared packages consumed by both `apps/api` and `apps/web`. Use them correctly — never duplicate what they already define.

### `packages/schemas` — Zod validation schemas

**Decision rule:** if a schema validates data that crosses the API boundary (a request body or a query param), it belongs in `packages/schemas`. If it is purely a UI-level concern (e.g. a search input that never goes to the API), keep it local.

**What already exists** — import from `@grow-logs/schemas`, never redefine locally:

| Export                                               | Use in frontend             |
| ---------------------------------------------------- | --------------------------- |
| `registerSchema` / `RegisterDto`                     | Register form validation    |
| `loginSchema` / `LoginDto`                           | Login form validation       |
| `verifyEmailSchema` / `VerifyEmailDto`               | Email verification form     |
| `resendVerificationSchema` / `ResendVerificationDto` | Resend form                 |
| `changePasswordSchema` / `ChangePasswordDto`         | Change password form        |
| `updateUserSchema` / `UpdateUserDto`                 | Edit profile form           |
| `uuidSchema`                                         | Validating UUID path params |
| `paginationSchema` / `PaginationParams`              | Paginated list query params |

**When adding a new schema** (e.g. `createEntrySchema`, `createCategorySchema`): add it to `packages/schemas/src/<feature>.ts`, export it from `packages/schemas/src/index.ts`, then import in both `apps/api` (Zod pipe) and `apps/web` (form validation). Never define a schema in one app only.

### `packages/types` — shared TypeScript interfaces

**What it is for:** TypeScript interfaces that describe the shapes returned by the API — things both apps agree on. Currently empty (`export {}`); it will be populated as frontend API hooks are built.

**Decision rule:** if a TypeScript interface describes an API response shape that the frontend needs to consume, define it in `packages/types`. If it is a UI-only type (component props, local state shape), define it locally in `src/types/` or inline above the component.

**When wiring up a resource hook**, add the response interface to `packages/types/src/index.ts`:

```typescript
// packages/types/src/index.ts
export interface UserProfile {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  createdAt: string;
}

export interface Category { ... }
export interface Entry { ... }
```

Then import in the hook:

```typescript
import type { UserProfile } from '@grow-logs/types';
```

**`src/data/dashboard-mock.ts` is temporary.** The interfaces defined there (`MockEntry`, `MockCategory`, `DashboardStats`, etc.) are placeholders used until the dashboard is wired to real API hooks. When each resource hook is built, replace the mock interface with the real type from `@grow-logs/types` and delete the mock equivalent.

---

## Form Rules

- Every form uses **React Hook Form** + a **Zod schema** from `packages/schemas`
- Auth schemas (`registerSchema`, `loginSchema`, etc.) already exist — import them, never redefine
- Never duplicate a validation rule — if it belongs to a shared resource, it goes in `packages/schemas` and is imported here
- Every field shows inline validation errors — no page-level error summaries as a substitute
- Forms are extracted into their own component files — never inline a full form inside a page
- Submit buttons are disabled and show a loading indicator while the mutation is in flight

```typescript
const form = useForm<CreateEntryInput>({
  resolver: zodResolver(createEntrySchema),
  defaultValues: { ... },
});
```

---

## TypeScript Rules

- Strict mode — no `any`, no `as any`, no `// @ts-ignore`
- `unknown` over `any` when the type is genuinely unknown
- Explicit prop interfaces for every component (see Component Rules above)
- Explicit return types on all exported functions and hooks
- Never cast with `as SomeType` to escape a type error — fix the type

---

## State Management Rules

| State type                                      | Where it lives                           |
| ----------------------------------------------- | ---------------------------------------- |
| Server data (entries, categories, user profile) | React Query                              |
| Auth (current user object, isAuthenticated)     | Zustand `useAuthStore`                   |
| UI state (sidebar, modals, toasts)              | Zustand `useUiStore` or local `useState` |
| Form state                                      | React Hook Form                          |
| URL state (filters, pagination, active tab)     | `useSearchParams`                        |

No prop drilling past 2 levels — if a prop needs to go deeper, move it to the appropriate store or context.

---

## Error Handling Rules

- API errors are displayed to the user via **toast notifications** — never raw error objects in the UI
- Every mutation's `onError` handler must show a toast with a user-readable message
- Never expose API error internals (stack traces, SQL errors, internal codes) to the user
- Use **Error Boundaries** (`error.tsx` in App Router) at the route-group level to catch unexpected render errors

```typescript
// correct
onError: (error) => {
  toast.error(getApiErrorMessage(error) ?? 'Something went wrong. Please try again.');
};
```

---

## Accessibility Rules

- Semantic HTML always — `<nav>`, `<main>`, `<section>`, `<article>`, `<button>` not `<div onClick>`
- Every interactive element is keyboard accessible and has a visible focus ring
- Images use `next/image` — always provide a descriptive `alt`; use `alt=""` only for decorative images
- Form fields always have an associated `<label>` — never rely on placeholder text as the only label
- Color is never the only way to convey information (also use text, icons, or patterns)

---

## Performance Rules

- `next/image` for all images — never raw `<img>` tags
- `next/link` for all internal navigation — never `<a href="...">`
- No `useEffect` + `useState` pairs for derived values — compute inline or use `useMemo`
- `React.memo` only when a profiler shows a real problem — not preemptively
- Dynamic imports (`next/dynamic`) for heavy components that are not visible on initial load

---

## After Completing Any Frontend Step

When a frontend step is fully implemented, update these files before ending the session:

**1. `CONTEXT.md` — update the Current Phase section** with last completed step, next step, and progress count.

**2. `README.md` — update after every step:**

- Update the progress counter
- Add any new commands introduced (e.g. `npm run dev` from `apps/web`)

**3. `docs/phases/frontend/PHASES.md`** _(to be created when frontend phases are defined)_ — mark the step complete.
