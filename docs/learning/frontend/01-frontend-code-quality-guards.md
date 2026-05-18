# 01 — Frontend Code Quality Guards

**Phase:** Pre-implementation setup | **Concepts:** TypeScript strict compiler options, type-aware ESLint, React Query lint rules, coverage thresholds, pre-commit hooks, Next.js correctness config

---

## Why Quality Guards Matter More in a Frontend Codebase

The backend is statically typed end-to-end and runs in a controlled environment. The frontend adds several layers of additional risk:

- **Browser runtime unpredictability** — the JS engine, the network, and the DOM all fail in ways the server never does
- **Async everywhere** — data fetching, event handlers, transitions, and effects all involve promises
- **Component trees** — a type error or an unhandled state in one leaf component can crash the entire page
- **Library-specific patterns** — React Query, React Hook Form, and Zustand all have subtle wrong-usage patterns that TypeScript alone cannot catch

The quality guards set up in this project form layers: TypeScript catches type errors, ESLint catches pattern errors, React Query's plugin catches data-fetching errors, Husky stops bad code from landing in git, and the Next.js config removes footguns from the framework itself.

---

## Layer 1: TypeScript Strict Compiler Options

### What `strict: true` actually enables

`strict: true` in `tsconfig.json` is a shorthand that turns on a group of compiler flags simultaneously. The most important ones:

| Flag | What it catches |
|---|---|
| `strictNullChecks` | Prevents using `null` or `undefined` where a value is expected |
| `noImplicitAny` | Prevents variables from being implicitly typed as `any` |
| `strictFunctionTypes` | Stricter checking of function parameter types in callbacks |
| `strictPropertyInitialization` | Class properties must be initialised in the constructor |

Without `strict: true`, TypeScript becomes much weaker. A common example:

```typescript
// Without strictNullChecks — compiles fine, crashes at runtime
function getLength(value: string) {
  return value.length;
}
getLength(undefined); // TypeScript says OK, runtime throws TypeError
```

With `strictNullChecks` on, TypeScript flags `getLength(undefined)` as a type error before the code runs.

---

### The three additional options added to this project

Beyond `strict`, three extra compiler options are enabled in `apps/web/tsconfig.json`:

#### `noUnusedLocals: true`

Flags local variables that are declared but never read.

```typescript
// Error: 'unusedVar' is declared but its value is never read
function processEntry(entry: Entry) {
  const unusedVar = entry.id; // declared, never used
  return entry.text;
}
```

Why this matters for AI-generated code: AI frequently imports utilities or declares variables as part of building a feature, then removes the usage but leaves the declaration. These accumulate silently without this flag.

#### `noUnusedParameters: true`

Flags function parameters that are never read inside the function body.

```typescript
// Error: 'event' is declared but its value is never read
function handleClick(event: MouseEvent) {
  setOpen(true); // event is never used
}

// Correct ways to handle this:
function handleClick(_event: MouseEvent) { ... }  // prefix with _ to signal intentional
function handleClick() { ... }                     // remove the param if truly unused
```

#### `noImplicitOverride: true`

When a class extends another class, any method that overrides a parent method must use the `override` keyword. Without it, if the parent renames the method, your override silently becomes a brand new method — the parent's original behaviour is inherited unchanged.

```typescript
class BaseComponent extends React.Component {
  componentDidMount() { ... }
}

// Without noImplicitOverride — compiles, but is this an override or a new method?
class MyComponent extends BaseComponent {
  componentDidMount() { ... } // ambiguous

  // With noImplicitOverride — intent is explicit
  override componentDidMount() { ... } // clearly an override
}
```

This flag is most relevant in class-based code. In functional React with hooks, it rarely triggers — but it protects any class-based utility code and the occasional class-based error boundary.

---

## Layer 2: ESLint — Pattern-Level Correctness

ESLint operates at the pattern level. It understands code structure — which expressions are promises, which imports are type-only, which function calls are dangerous — in ways TypeScript's type system alone cannot.

### How ESLint config is structured in this project

`apps/web/eslint.config.mjs` uses ESLint's flat config format (the modern format that replaced `.eslintrc`). Config items are spread into an array in order — later items override earlier ones:

```javascript
const eslintConfig = defineConfig([
  ...nextVitals,          // Next.js core web vitals rules (includes jsx-a11y, react-hooks)
  ...nextTs,              // Next.js TypeScript rules
  ...queryPlugin.configs['flat/recommended'],  // React Query rules
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: { parserOptions: { project: true } },
    rules: { /* custom rules */ },
  },
  prettier,               // disables formatting rules that conflict with Prettier (always last)
]);
```

The order matters: later entries win on conflicts. `prettier` always goes last because it turns *off* rules — if it were first, everything after it would re-enable them.

---

### Type-aware linting (`parserOptions.project: true`)

Standard ESLint rules analyse the *syntax* of code — the structure of the AST. Type-aware rules go further: they run the TypeScript type checker and use the inferred types to make decisions about which rules to apply.

This is why `parserOptions.project: true` is needed. It tells ESLint's TypeScript parser to load the `tsconfig.json` and build the full type graph before analysing files. This makes linting slower but enables an entirely different class of rules.

```typescript
// Type-aware rule: @typescript-eslint/no-floating-promises
// The linter knows this expression produces a Promise<void> (type info)
// and can check whether that promise is being handled

enableMocking(); // Error: floating promise — return value ignored

// Correct options:
await enableMocking();
void enableMocking();    // void explicitly discards the return value
enableMocking().catch(console.error);
```

Without type information, a lint rule cannot tell whether `enableMocking()` returns a promise or a plain value. With type information, it knows exactly.

---

### The four custom ESLint rules

#### `@typescript-eslint/no-floating-promises`

Promises that are not awaited, `.catch()`-ed, or `void`-ed are "floating". They run independently and their failures are undetectable.

```typescript
// Dangerous — if this throws, the error is swallowed silently
api.post('/entries', data);

// Correct patterns
await api.post('/entries', data);          // await in async context
void api.post('/entries', data);           // explicitly discarding the result
api.post('/entries', data).catch(console.error); // explicit error handling
```

React's `useEffect` creates a common trap here. Effects cannot be `async` functions, but they regularly call async code:

```typescript
// Wrong — causes a floating promise lint error
useEffect(async () => {
  await fetchData();
}, []);

// Correct — define the async function inside, call it, use void to discard the promise
useEffect(() => {
  void fetchData();
}, []);

// Or with explicit error handling:
useEffect(() => {
  fetchData().catch(console.error);
}, []);
```

#### `@typescript-eslint/consistent-type-imports`

TypeScript has two ways to import a type: with `import` and with `import type`. Using `import type` tells the bundler this import is erased at compile time — the symbol only exists in TypeScript's type system and produces zero JavaScript output.

```typescript
// Wrong — imports the runtime module even though only the type is used
import { Entry } from '@grow-logs/types';
function show(entry: Entry) { ... }

// Correct — bundler knows this is type-only and can safely tree-shake it
import type { Entry } from '@grow-logs/types';
function show(entry: Entry) { ... }
```

The rule is configured with `fixStyle: 'inline-type-imports'`, which allows mixing runtime and type imports from the same module in one line:

```typescript
// One import statement for both runtime value and type
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
```

#### `@typescript-eslint/no-explicit-any`

The `any` type disables TypeScript's type checking for that value. Once a value is typed as `any`, TypeScript stops checking how you use it — every property access, every method call, every assignment is silently allowed.

```typescript
// Dangerous: TypeScript accepts everything after this
const response: any = await api.get('/entries');
response.data.totalNonExistentField; // no error — any swallows type checking

// Correct: use unknown for values of unknown shape, then narrow
const response: unknown = await api.get('/entries');
if (typeof response === 'object' && response !== null && 'data' in response) {
  // now TypeScript knows it's safe to access .data
}

// Or use a typed interface for known API shapes
const response = await api.get<{ data: Entry[] }>('/entries');
response.data; // typed correctly
```

The rule with `fixStyle: 'error'` means `any` anywhere in source files is a build-time failure, not a warning.

#### `no-console`

`console.log` is the debugging tool of choice during development. Left in production code, it leaks internal application state to anyone with browser DevTools open and clutters the console output in ways that obscure real errors.

```typescript
// Blocked: leaks state, clutters console
console.log('user data:', user);
console.log('API response:', response);

// Allowed: error and warn signal actual problems
console.error('Failed to load entry:', error);
console.warn('Token expired, refreshing session');
```

The rule is configured as `'warn'` (not `'error'`) so it shows up as a warning during development without failing the lint run. The `--max-warnings=0` flag in `lint-staged` upgrades all warnings to errors at commit time — so it is effectively an error before code can land in git.

---

## Layer 3: React Query ESLint Plugin

`@tanstack/eslint-plugin-query` understands the React Query API and catches patterns that cause bugs invisible to TypeScript and general ESLint rules.

### Why React Query needs its own lint rules

React Query's correctness depends on patterns that are valid TypeScript but semantically wrong. The most dangerous ones involve query keys.

A query key is the cache identity for a query. React Query compares query keys by deep equality to decide when to re-fetch. If a key includes a reference to an object or array that is recreated on every render, the key changes on every render, triggering an infinite re-fetch loop:

```typescript
// Bug: new object created on every render → query key changes every render
// → React Query sees a "new" query every render → infinite re-fetch loop
function EntryList({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['entries', { userId }],  // { userId } is a new object every render!
    queryFn: () => fetchEntries(userId),
  });
}

// Correct: primitive value in the key — stable across renders
function EntryList({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['entries', userId],  // string primitive — stable
    queryFn: () => fetchEntries(userId),
  });
}
```

### The three rules the plugin enforces

**`@tanstack/query/exhaustive-deps`**

All reactive values used inside `queryFn` must appear in `queryKey`. If a value changes but is not in the key, React Query will not re-fetch — you get stale data.

```typescript
// Bug: filters are used in queryFn but not in queryKey
// If filters change, React Query uses the cached result for the old filters
function useEntries(filters: EntryFilters) {
  return useQuery({
    queryKey: ['entries'],                          // Missing filters!
    queryFn: () => api.get('/entries', { params: filters }),
  });
}

// Correct: all queryFn inputs are in queryKey
function useEntries(filters: EntryFilters) {
  return useQuery({
    queryKey: ['entries', filters],                // filters included
    queryFn: () => api.get('/entries', { params: filters }),
  });
}
```

**`@tanstack/query/stable-query-client`**

`QueryClient` is the in-memory cache. Creating a new one inside a component creates a new cache on every render — all cached data is lost and re-fetched from scratch on every render.

```typescript
// Bug: new QueryClient (new cache) on every render
function App() {
  const queryClient = new QueryClient(); // created on every render!

  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}

// Correct: create once, outside or with useState/useRef
function App() {
  const [queryClient] = useState(() => new QueryClient());
  // or at module level: const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
```

In this project, `QueryClientProvider` is set up once in `providers/query-provider.tsx` using `useState` — the plugin ensures it stays that way.

---

## Layer 4: Pre-commit Hooks with Husky and lint-staged

### What Husky does

Husky manages Git hooks — scripts that run at defined points in the Git lifecycle. The project configures a `pre-commit` hook: a script that runs every time you run `git commit`, before the commit is finalised.

If the hook script exits with a non-zero code, Git cancels the commit entirely. The code never enters git history.

```
git commit -m "add entry form"
  → Git triggers .husky/pre-commit
  → .husky/pre-commit runs: npx lint-staged
    → lint-staged runs ESLint + Prettier on staged files
    → If lint-staged exits 0: commit proceeds
    → If lint-staged exits 1 (lint error): commit aborted
```

The hook only checks staged files — files that are in `git add`'s staging area. Unstaged changes are not checked. This keeps the hook fast: only the files about to be committed are linted.

### What lint-staged does

lint-staged takes the list of staged files, filters them by the glob patterns in its config, and runs the configured commands on only the matched files.

The root `package.json` config:

```json
"lint-staged": {
  "apps/web/**/*.{ts,tsx,mts}": [
    "eslint --fix --max-warnings=0",
    "prettier --write"
  ],
  "apps/web/**/*.{json,css,md}": [
    "prettier --write"
  ],
  "apps/api/**/*.ts": [
    "eslint --fix --max-warnings=0",
    "prettier --write"
  ]
}
```

**`eslint --fix`** runs ESLint and automatically fixes any rules that have auto-fixers (import ordering, `consistent-type-imports`, etc.). Issues that cannot be auto-fixed cause the command to exit 1, aborting the commit.

**`--max-warnings=0`** upgrades warnings to errors. `no-console` is configured as a `'warn'` in the ESLint config (so it doesn't fail during development when you're debugging), but `--max-warnings=0` means it becomes a commit-time error. Warnings only exist in development; they cannot reach git.

**`prettier --write`** formats the file and writes the result back. Because lint-staged re-stages the file after each command, the formatted version is what gets committed.

### Why `eslint --fix` runs before `prettier --write`

ESLint's `--fix` may change the code structure in ways that affect formatting. For example, `consistent-type-imports` might restructure an import line. Running Prettier after ESLint's fixes ensures the final committed file is consistently formatted regardless of what ESLint changed.

---

## Layer 5: Coverage Thresholds

### What coverage measures and what it doesn't

Code coverage measures which lines, branches, functions, and statements are executed during a test run. A line is "covered" if any test caused it to run.

**What coverage guarantees:** the covered code was executed without throwing an unexpected error during the test run.

**What coverage does not guarantee:** correctness. A test can execute a function without asserting anything meaningful about its output. Coverage is a measure of test execution, not test quality.

The threshold in `vitest.config.ts` enforces a minimum. If coverage drops below 60% on any metric, the `test:ci` command exits with a non-zero code and CI fails. This prevents a situation where new feature code is merged with 0% test coverage.

### Four coverage metrics

```
function calculateScore(entries: Entry[]): number {
  if (entries.length === 0) {           // branch 1: true path
    return 0;                           // line, statement, function
  }
  const sum = entries.reduce(           // branch 1: false path
    (acc, e) => acc + (e.score ?? 0),  // branch 2: e.score ?? 0
    0
  );
  return sum / entries.length;
}
```

| Metric | What it measures | In this example |
|---|---|---|
| **Statement** | Each executable statement | 5 statements |
| **Line** | Each physical line of code | 5 lines |
| **Branch** | Each conditional path | 3 branches (if-true, if-false, nullish) |
| **Function** | Each declared function | 1 function |

Branch coverage is the hardest to reach — you must write tests for both sides of every condition. For a hook that calls an API, you need tests for both the success path and every error case to hit high branch coverage.

### What to test in the frontend

```typescript
// hooks/use-entries.ts — this is the equivalent of a service in the backend
// Target: ≥ 70% coverage

export function useCreateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEntryDto) =>
      api.post<{ data: Entry }>('/entries', data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}
```

Test this hook by rendering it in a test component with a `QueryClientProvider` and MSW intercepting the HTTP request:

```typescript
// hooks/use-entries.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useCreateEntry } from './use-entries';
import { createWrapper } from '../test/test-utils'; // QueryClientProvider wrapper

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('creates an entry and invalidates the entries query', async () => {
  server.use(
    http.post('*/entries', () =>
      HttpResponse.json({ data: { id: '1', text: 'test entry' }, meta: {} }, { status: 201 })
    )
  );

  const { result } = renderHook(() => useCreateEntry(), { wrapper: createWrapper() });

  result.current.mutate({ type: 'WORK', text: 'test entry', entryDate: '2025-05-16', categoryId: 'cat-1' });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.text).toBe('test entry');
});
```

---

## Layer 6: Next.js Correctness and Performance Config

### `reactStrictMode: true`

React Strict Mode renders every component twice in development (the second render is silently discarded). This intentional double-render exposes bugs that only appear when:

- Effects are called more than once
- State updates have side effects
- Deprecated APIs are used

```typescript
// Bug exposed by strict mode — this effect runs twice in development
// revealing that it has an unintended side effect on first render
useEffect(() => {
  document.title = `Entries (${count})`;  // this is fine
  analytics.trackPageView('/dashboard');   // this fires twice in dev → reveals it shouldn't be in an effect
}, [count]);
```

If your app works correctly in strict mode, it will work correctly in production. The double-render is development-only — production always renders once.

### `experimental.typedRoutes: true`

This flag makes Next.js generate types for every route in the `app/` directory. The `<Link>` component's `href` prop becomes a union type of all valid routes rather than `string`.

```typescript
// Without typedRoutes — any string is accepted, typos compile silently
<Link href="/dashbord">Dashboard</Link>  // typo — still compiles

// With typedRoutes — only valid routes compile
<Link href="/dashbord">Dashboard</Link>  // TypeError: '/dashbord' is not a valid route
<Link href="/dashboard">Dashboard</Link> // correct
```

The types are generated into `.next/types/` during the build. When a route is deleted or renamed, every `<Link>` pointing to it becomes a compile error immediately — you can never accidentally have a dead internal link.

### `poweredByHeader: false`

By default, Next.js adds an `X-Powered-By: Next.js` HTTP response header. This tells anyone inspecting traffic which framework is in use — useful for fingerprinting the stack for targeted attacks. Disabling it removes one piece of information an attacker could use.

### `compiler.removeConsole` in production

```typescript
compiler: {
  removeConsole:
    process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
},
```

Next.js's SWC compiler (the Rust-based transpiler) rewrites the output JavaScript. In production, it removes every `console.log` and `console.debug` call entirely — not just the string, but the entire expression. This means:

1. No internal data is leaked to users with DevTools open
2. The production bundle is slightly smaller (no string literals for log messages)
3. `console.error` and `console.warn` are preserved so error boundaries and critical warnings still surface in production monitoring

This pairs with the `no-console: warn` ESLint rule: `console.log` is a development tool that should never reach production. The ESLint rule warns you locally, `--max-warnings=0` in lint-staged blocks it from committing, and `removeConsole` removes it from production builds as a final fallback.

---

## How All Layers Work Together

Each layer catches a different class of problem, and they reinforce each other:

```
Write code
    │
    ▼
TypeScript (tsc)
    Catches: type errors, unused locals, unused params, implicit override
    When: on every save (if IDE integration) and in npm run typecheck

    │
    ▼
ESLint (with type-aware rules)
    Catches: floating promises, any usage, wrong import style, console.log,
             React Query misuse, React hooks violations, accessibility issues
    When: on every save (IDE) and in npm run lint

    │
    ▼
Husky pre-commit → lint-staged
    Catches: any lint warning (escalated to error), formatting issues
    When: git commit — cannot be bypassed without --no-verify

    │
    ▼
GitHub Actions CI
    Catches: typecheck failure, lint failure, test failure, coverage below threshold
    When: every push and every pull request

    │
    ▼
Code is in git history
```

The pre-commit hook is the last local gate before code enters git. CI is the first external gate. Coverage thresholds sit inside CI — they ensure that new code is not just syntactically correct but also tested.

No single layer catches everything. TypeScript cannot catch floating promises. ESLint cannot catch type incompatibilities in complex generics. Husky cannot catch a test that runs but asserts nothing. They are complementary, not redundant.
