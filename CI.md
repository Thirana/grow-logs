# CI Pipeline

CI runs automatically on every push to `main` and every pull request. It has three sequential stages — a stage only runs if the previous one passes.

```
Quality → Test → Build
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

Checks code style, linting, and type correctness across all packages.

```bash
npx turbo run format:check lint typecheck
```

**What each check does:**

| Check | Command | What it catches |
|---|---|---|
| `format:check` | `prettier --check .` | Code style — spacing, quotes, line length, trailing commas |
| `lint` | `eslint "{src,test}/**/*.ts"` | Code quality rules — unused vars, unsafe patterns, Node.js security issues (`eslint-plugin-security`) |
| `typecheck` | `tsc --noEmit -p tsconfig.build.json` | TypeScript type errors across all source files |

**If `format:check` fails**, run Prettier to auto-fix:
```bash
cd apps/api && npx prettier --write .
```

**If `lint` fails**, run ESLint to auto-fix fixable issues:
```bash
cd apps/api && npm run lint:fix
```

**If `typecheck` fails**, the error output will point to the exact file and line.

---

## Stage 2 — Test

Runs unit tests with coverage. Only runs if Stage 1 passes.

```bash
npx turbo run test -- --runInBand --coverage
```

`--runInBand` runs tests serially in one process (avoids port conflicts between test suites). `--coverage` generates a coverage report in `apps/api/coverage/`.

After tests pass, the coverage report is automatically uploaded to **Codecov**. A PR comment will appear showing coverage diff on changed lines. The thresholds (configured in `codecov.yml`) are 30% overall project coverage and 50% on new lines introduced in each PR.

**If a test fails**, run just the API tests for faster feedback:
```bash
cd apps/api && npm test
```

---

## Stage 3 — Build

Compiles all packages. Only runs if Stage 2 passes.

```bash
npx turbo run build
```

**If build fails**, run the API build directly to see the full compiler output:
```bash
cd apps/api && npm run build
```

---

## Run Everything at Once

```bash
# From repo root
npm ci && \
npm run prisma:generate --workspace=apps/api && \
npx turbo run format:check lint typecheck && \
npx turbo run test -- --runInBand --coverage && \
npx turbo run build
```

If any step fails the chain stops, matching exactly how CI behaves.

---

## Notes

- **Turborepo remote cache:** CI uses a shared remote cache. A step marked `cache hit` was not re-run — it reused a previously passing result. If you see a failure on a file you did not change, it means the cache was invalidated and the check ran for the first time in a while.
- **`DATABASE_URL` in CI:** CI sets a dummy `DATABASE_URL` for all stages. No real database is needed — Prisma client generation and unit tests do not connect to a database.
- **Node version:** CI runs Node 24. If you are on a different version locally, switch via `nvm use 24` to match.
