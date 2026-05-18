# CI Pipeline

CI runs automatically on every push to `main` and every pull request. The pipeline has four jobs — `test-api` and `test-web` run in parallel after `quality` passes, and `build` only runs when both test jobs pass.

```
Quality
├── Test (API)  ─┐
└── Test (Web)  ─┴─ Build
```

**Run these commands locally before pushing.** If they all pass locally, CI will pass.

---

## Pre-commit Gate (local, runs before CI)

Husky runs `lint-staged` automatically on every `git commit`. This catches issues before they ever reach CI.

**What lint-staged does on commit:**
- Runs `eslint --fix` on every staged `.ts` / `.tsx` file in `apps/web` and `apps/api`
- Runs `prettier --write` on every staged file in those packages
- Aborts the commit if ESLint reports any error after auto-fixing

The pre-commit gate does not run tests or typecheck — those remain CI's responsibility. Its purpose is to ensure no lint error or formatting issue enters git history at all.

---

## Setup (run once)

```bash
# From repo root
npm ci
npm run prisma:generate --workspace=apps/api
```

`npm ci` installs all packages across the monorepo from the lockfile and also runs `husky` via the `prepare` script, activating the pre-commit hook. `prisma:generate` generates the Prisma client — its types must exist before typecheck can run.

---

## Stage 1 — Quality

Checks code style, linting, and type correctness across **both apps** via Turborepo.

```bash
npx turbo run format:check lint typecheck
```

Turborepo runs each task in every workspace that defines it — so this single command covers `apps/api` and `apps/web`.

**What each check does:**

| Check | Tool | What it catches |
|---|---|---|
| `format:check` | Prettier | Code style — spacing, quotes, line length, trailing commas |
| `lint` | ESLint | Code quality — see per-app rules below |
| `typecheck` | TypeScript (`tsc --noEmit`) | Type errors across all source files in both apps |

### Lint rules by app

**`apps/api`** — ESLint + TypeScript recommended + `eslint-plugin-security`:
- Unsafe Node.js patterns: `eval` with a variable, ReDoS regexes, `exec` with unsanitised input, non-literal `require`

**`apps/web`** — ESLint + Next.js core web vitals + TypeScript + React Query plugin:
- `@typescript-eslint/no-floating-promises` — every promise must be awaited, `.catch()`-ed, or `void`-ed
- `@typescript-eslint/no-explicit-any` — `any` type is a build error
- `@typescript-eslint/consistent-type-imports` — type-only imports must use `import type`
- `no-console` — `console.log` / `console.debug` are errors; `console.error` and `console.warn` are allowed
- `@tanstack/query/exhaustive-deps` — all reactive values used in a `queryFn` must appear in the `queryKey`
- `@tanstack/query/stable-query-client` — `QueryClient` must not be created inside a component
- `jsx-a11y` rules (via Next.js bundle) — accessibility: labels, ARIA, keyboard navigation
- `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps` (via Next.js bundle)

**If `format:check` fails**, auto-fix with Prettier:
```bash
# API
cd apps/api && npx prettier --write .
# Web
cd apps/web && npx prettier --write .
```

**If `lint` fails**, auto-fix fixable issues:
```bash
# API
cd apps/api && npm run lint:fix
# Web (ESLint has no lint:fix script — fix manually, or use eslint --fix directly)
cd apps/web && npx eslint --fix src/
```

**If `typecheck` fails**, the error output points to the exact file and line. Web also enforces `noUnusedLocals`, `noUnusedParameters`, and `noImplicitOverride` in addition to `strict`.

---

## Stage 2 — Tests (API + Web, run in parallel in CI)

API and web tests are independent and run in parallel in CI. Run both locally before pushing.

### API tests (Jest)

```bash
cd apps/api && npm run test:ci
```

`test:ci` runs `jest --runInBand --coverage`. `--runInBand` serialises tests in one process. Coverage is written to `apps/api/coverage/`.

**If a test fails**, run without coverage for faster iteration:
```bash
cd apps/api && npm test
```

### Web tests (Vitest)

```bash
cd apps/web && npm run test:ci
```

`test:ci` runs `vitest run --coverage`. Coverage is written to `apps/web/coverage/`.

**If a test fails**, run without coverage:
```bash
cd apps/web && npm test
```

### Run both at once via Turborepo

```bash
npx turbo run test:ci
```

This runs both `apps/api` and `apps/web` test suites in parallel and collects both coverage reports.

### Coverage

**Vitest thresholds (enforced in the test step itself):**

The web Vitest config enforces a minimum across all four coverage metrics. If any metric drops below the threshold, `test:ci` exits with a non-zero code and the `test-web` CI job fails.

| Metric | Web threshold |
|---|---|
| Lines | 60% minimum |
| Branches | 60% minimum |
| Functions | 60% minimum |
| Statements | 60% minimum |

Coverage is measured over: `hooks/`, `stores/`, `lib/`, `components/common/`, `components/dashboard/`, `components/auth/`, `components/onboarding/`, `components/categories/`, `components/settings/`. Pages (`app/`) and shadcn primitives (`components/ui/`) are excluded.

**Codecov (post-test upload, PR comment gate):**

After tests pass in CI, both reports are uploaded to **Codecov** under separate flags (`api` and `web`). A PR comment shows the coverage diff on changed lines.

| Scope | Threshold |
|---|---|
| Overall project coverage | 30% minimum |
| New lines introduced in a PR | 50% minimum |

The Codecov thresholds are configured in `codecov.yml` and are separate from the Vitest thresholds. The Vitest threshold fails the test job itself; the Codecov threshold posts a status check on the PR.

---

## Stage 3 — Build

Compiles all packages. Only runs if both test jobs pass.

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 npx turbo run build
```

`NEXT_PUBLIC_API_URL` is required by `apps/web/src/lib/env.ts`, which validates it with Zod at build time. The build will fail without it.

**What the web build additionally verifies:**

`next.config.ts` has `experimental.typedRoutes: true`. During `next build`, Next.js generates TypeScript types for every route defined in `app/`. The TypeScript compiler then checks every `<Link href="...">` against those generated types. A `<Link>` pointing to a route that does not exist — including routes renamed or deleted since the link was written — is a type error that fails the build.

This means dead internal links are caught in the `build` stage, not discovered at runtime.

**If the API build fails**:
```bash
cd apps/api && npm run build
```

**If the web build fails**:
```bash
cd apps/web && NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 npm run build
```

---

## Run Everything at Once

```bash
# From repo root
npm ci && \
npm run prisma:generate --workspace=apps/api && \
npx turbo run format:check lint typecheck && \
npx turbo run test:ci && \
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 npx turbo run build
```

If any step fails the chain stops, matching exactly how CI behaves.

---

## Notes

- **Husky pre-commit hook:** `npm ci` activates Husky automatically via the `prepare` script. If the hook is not running, check that `.husky/pre-commit` exists and is executable (`chmod +x .husky/pre-commit`).
- **Turborepo remote cache:** CI uses a shared remote cache. A step marked `cache hit` was not re-run — it reused a previously passing result. If you see a failure on a file you did not change, it means the cache was invalidated and the check ran for the first time in a while.
- **`DATABASE_URL` in CI:** CI sets a dummy `DATABASE_URL` for all stages. No real database is needed — Prisma client generation and API unit tests do not connect to a database.
- **`NEXT_PUBLIC_API_URL` in CI:** CI sets this to `http://localhost:3000/api/v1` for the build stage. Web unit tests do not need it — Vitest sets it via `env` in `vitest.config.ts`.
- **Node version:** CI runs Node 24. If you are on a different version locally, switch with `nvm use 24` to match.
