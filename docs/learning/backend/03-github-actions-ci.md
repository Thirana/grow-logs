# 03 — GitHub Actions and CI

**Phase:** Phase 2 | **Concepts:** Continuous Integration, GitHub Actions, workflows, jobs, steps, runners, secrets

---

## What is Continuous Integration?

**Continuous Integration (CI)** is the practice of automatically verifying every code change the moment it is pushed. A CI system checks out the code on a **clean machine**, runs your quality checks, and reports pass or fail.

The key word is *clean*. CI eliminates "works on my machine" because it never inherits anything from a developer's local environment. If it passes CI, it is verified to work from a fresh checkout on a neutral machine.

### What CI enforces

Without CI, these checks exist but are manual and easy to skip:
- Did you remember to run the formatter?
- Does the TypeScript still compile after your change?
- Did your change break an existing test?
- Does the production build still succeed?

With CI, none of these can be skipped. The pipeline runs them automatically on every push and every pull request.

---

## GitHub Actions Concepts

GitHub Actions is GitHub's built-in CI system. Pipelines are defined as YAML files in `.github/workflows/`. GitHub runs them on their servers when triggered.

### Core concepts

**Workflow** — the entire pipeline, defined in one `.yml` file. Triggered by an event.

**Trigger** — what causes the workflow to run:
```yaml
on:
  push:
    branches: [main]    # runs on every push to main
  pull_request:         # runs on every PR, against any branch
```

**Job** — a group of steps that run on one machine. Multiple jobs can run in parallel or be chained with `needs`.

**Step** — one command or action within a job. Steps within a job run sequentially.

**Action** — a reusable step published to the GitHub Marketplace (e.g. `actions/checkout`, `actions/setup-node`). Actions abstract away boilerplate like checking out code or installing Node.

**Runner** — the virtual machine GitHub spins up to execute a job. This repo uses `ubuntu-latest` — a fresh Ubuntu VM that is destroyed after the job finishes. Nothing persists between runs.

**Secret** — an encrypted value stored in GitHub repository settings. Referenced in the workflow as `${{ secrets.MY_SECRET }}`. Never appears in logs — GitHub masks it automatically.

**Environment variable** — set at workflow, job, or step level with `env:`. Available to all commands in that scope.

### Job sequencing

```yaml
jobs:
  quality:
    runs-on: ubuntu-latest
    # no 'needs' — runs immediately

  test:
    runs-on: ubuntu-latest
    needs: quality      # only starts after quality passes

  build:
    runs-on: ubuntu-latest
    needs: test         # only starts after test passes
```

If `quality` fails, `test` and `build` never start. This is fail-fast — you don't waste time running tests against code that doesn't even typecheck.

---

## This Repo's Pipeline

```
push to main / open PR
         │
         ▼
   ┌─────────────┐
   │   quality   │  format:check + lint + typecheck
   └──────┬──────┘
          │ passes
          ▼
   ┌─────────────┐
   │    test     │  unit tests + coverage upload to Codecov
   └──────┬──────┘
          │ passes
          ▼
   ┌─────────────┐
   │    build    │  nest build (production build)
   └─────────────┘
```

### The full workflow file

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ci

jobs:
  quality:
    name: Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - uses: actions/cache@v5
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm run prisma:generate
        working-directory: apps/api
      - run: npx turbo run format:check lint typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - uses: actions/cache@v5
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm run prisma:generate
        working-directory: apps/api
      - run: npx turbo run test -- --runInBand --coverage
      - uses: codecov/codecov-action@v6
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          directory: apps/api/coverage
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - uses: actions/cache@v5
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - run: npm run prisma:generate
        working-directory: apps/api
      - run: npx turbo run build
```

### Key decisions explained

**`npm ci` instead of `npm install`**

`npm install` may update `package-lock.json` if dependency resolution produces a different result. `npm ci` does a clean install using exactly what `package-lock.json` specifies, then deletes and reinstalls from scratch. CI should always reproduce a known-good state.

**`node_modules` caching**

Installing dependencies is the slowest step. The cache is keyed on `hashFiles('package-lock.json')` — if the lockfile changes (a dependency was added or updated), the cache is invalidated and a fresh install runs. Otherwise the cached `node_modules` is restored in seconds.

**`DATABASE_URL` as an env var**

The unit test setup file (`test/jest.setup-env.ts`) sets `DATABASE_URL` itself, so tests don't need a real database. But `prisma generate` reads `prisma.config.ts` which references `process.env['DATABASE_URL']`. The workflow sets it to a placeholder value so the generate step doesn't throw.

**Turborepo in CI**

`TURBO_TOKEN` and `TURBO_TEAM` enable the Vercel remote cache. After the first CI run, subsequent runs with the same inputs skip re-execution and download cached artifacts instead. You can verify this by looking for `Remote caching enabled` and `Cached: N cached, N total` in the CI logs.

**No e2e tests in CI yet**

E2e tests require a running PostgreSQL container. That complexity is added later (Step 14+) once there are real business modules with meaningful database interactions to test. The unit tests run without a database because `jest.setup-env.ts` provides all required env vars including a fake `DATABASE_URL`.

---

## Branch Protection

CI alone doesn't block bad code from merging — it only reports. Branch protection makes it enforceable:

GitHub → Repository Settings → Branches → Add rule → `main`:
- ✅ Require status checks to pass before merging → select `ci`
- ✅ Require branches to be up to date before merging

After this, no PR can be merged to `main` without a green CI run.

---

## Interview Summary

**Q: What is CI and why does it matter?**
CI runs your quality checks automatically on every push using a clean machine. It eliminates "works on my machine" and ensures no broken code can land in the main branch. The clean machine part is critical — it means the build is always reproducible, not dependent on anyone's local environment.

**Q: What is the difference between a job and a step in GitHub Actions?**
A step is one command or action within a job. A job is a group of steps that run on the same machine. Jobs can run in parallel or be chained — in this repo, `test` only runs if `quality` passes, and `build` only runs if `test` passes.

**Q: Why use `npm ci` instead of `npm install` in CI?**
`npm ci` installs exactly what `package-lock.json` specifies, ensuring reproducibility. `npm install` can silently update the lockfile if resolution produces different results. In CI you want deterministic installs, not opportunistic updates.

**Q: What is a GitHub Actions secret?**
An encrypted value stored in GitHub repository settings. It is never exposed in logs and is only available to workflow runs on the repository. Used for tokens like `TURBO_TOKEN`, `CODECOV_TOKEN` — values that must not appear in the source code.
