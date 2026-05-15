# CI Pipeline

CI runs automatically on every push to `main` and every pull request. The pipeline has four jobs — `test-api` and `test-web` run in parallel after `quality` passes, and `build` only runs when both test jobs pass.

```
Quality
├── Test (API)  ─┐
└── Test (Web)  ─┴─ Build
```

**Run these commands locally before pushing.** If they all pass locally, CI will pass.

---

## Setup (run once)

```bash
# From repo root
npm ci
npm run prisma:generate --workspace=apps/api
```

`npm ci` installs all packages across the monorepo from the lockfile. `prisma:generate` generates the Prisma client — its types must exist before typecheck can run.

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
| `lint` | ESLint | Code quality — unused vars, unsafe patterns; API also runs `eslint-plugin-security` |
| `typecheck` | TypeScript (`tsc --noEmit`) | Type errors across all source files in both apps |

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
# Web — ESLint has no lint:fix script; re-run to see the error output
cd apps/web && npm run lint
```

**If `typecheck` fails**, the error output points to the exact file and line.

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

After tests pass in CI, both reports are uploaded to **Codecov** under separate flags (`api` and `web`). A PR comment shows the coverage diff on changed lines. Thresholds are configured in `codecov.yml`:

| Scope | Threshold |
|---|---|
| Overall project coverage | 30% minimum |
| New lines introduced in a PR | 50% minimum |

---

## Stage 3 — Build

Compiles all packages. Only runs if both test jobs pass.

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 npx turbo run build
```

`NEXT_PUBLIC_API_URL` is required by `apps/web/src/lib/env.ts`, which validates it with Zod at build time. The build will fail without it.

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

- **Turborepo remote cache:** CI uses a shared remote cache. A step marked `cache hit` was not re-run — it reused a previously passing result. If you see a failure on a file you did not change, it means the cache was invalidated and the check ran for the first time in a while.
- **`DATABASE_URL` in CI:** CI sets a dummy `DATABASE_URL` for all stages. No real database is needed — Prisma client generation and API unit tests do not connect to a database.
- **`NEXT_PUBLIC_API_URL` in CI:** CI sets this to `http://localhost:3000/api/v1` for the build stage. Web unit tests do not need it — Vitest sets it via `env` in `vitest.config.ts`.
- **Node version:** CI runs Node 24. If you are on a different version locally, switch with `nvm use 24` to match.
