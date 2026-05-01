# Step 06 — GitHub Actions CI Pipeline

**Phase:** Phase 2 — NestJS Bootstrap + Prisma Schema
**Depends on:** Step 04 (NestJS app must exist and scripts must be defined)

---

## What

Create a GitHub Actions CI workflow that runs on every push and pull request. The pipeline enforces that code is correctly formatted, typed, linted, built, and tested before it can be merged. It uses Turborepo's affected-package detection to skip work that hasn't changed.

---

## Why

A CI pipeline is not just for catching bugs — it enforces the quality bar consistently regardless of who is making the change (including a coding agent). Without CI, it is easy to accidentally merge code that breaks a test, introduces a type error, or fails to build.

Setting this up immediately after the bootstrap means every subsequent step is validated by the same pipeline from day one. Adding CI later means earlier phases were never verified in a clean environment.

---

## Deliverables

**`.github/workflows/ci.yml`**

Pipeline triggered on `push` to `main` and on all `pull_request` events.

Jobs (run in order, each depends on the previous):

1. **`quality`** — format check, lint, typecheck
   ```
   npm ci
   npx turbo run format:check lint typecheck --filter=[HEAD^1]
   ```

2. **`test`** — unit tests with coverage
   ```
   npx turbo run test -- --runInBand --coverage
   ```
   Upload coverage report to Codecov using `codecov/codecov-action`

3. **`build`** — production build
   ```
   npx turbo run build --filter=[HEAD^1]
   ```

**Caching:**
- Cache `node_modules` using `actions/cache` keyed on `package-lock.json` hash
- Set `TURBO_TOKEN` and `TURBO_TEAM` environment variables from GitHub secrets to enable Turborepo remote cache

**Environment variables for the CI run:**
- `DATABASE_URL` — set to a test value (e.g. `postgresql://postgres:postgres@localhost:5432/test`) for unit tests. E2E tests that require a real database are skipped in CI at this stage and added later.

---

## Key Decisions

**`--filter=[HEAD^1]`:** Turborepo's affected-package filter — only runs tasks for packages that have changed since the last commit. On a monorepo this can reduce CI time dramatically as the project grows.

**Unit tests only in CI (no e2e yet):** E2E tests require a running PostgreSQL container. Setting up a Postgres service container in GitHub Actions is possible but adds complexity. That is added once the first business module with real DB interactions exists (Step 14 or later). For now, `jest.setup-env.ts` already mocks the database connection so unit tests run without Postgres.

**Coverage uploaded to Codecov:** Codecov tracks coverage trends over time and posts a diff on every PR showing which lines are newly covered or uncovered. Configured by adding `codecov.yml` with a minimum coverage threshold.

**Secrets required:** `TURBO_TOKEN`, `TURBO_TEAM` (Turborepo remote cache), `CODECOV_TOKEN` (Codecov upload). These must be added to the GitHub repository settings before the pipeline is fully functional.

---

## Done When

- `.github/workflows/ci.yml` exists and is valid YAML
- Pushing a commit to GitHub triggers the workflow
- All three jobs pass on a clean branch
- Codecov receives a coverage report
- A deliberately broken type triggers a CI failure on the `quality` job
