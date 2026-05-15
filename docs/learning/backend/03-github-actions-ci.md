# 03 — GitHub Actions and CI

**Phase:** Phase 2 | **Concepts:** Continuous Integration, GitHub Actions, workflows, jobs, steps, runners, secrets, monorepo dependency ordering

---

## What is Continuous Integration?

**Continuous Integration (CI)** is the practice of automatically verifying every code change the moment it is pushed. A CI system checks out the code on a **clean machine**, runs your quality checks, and reports pass or fail.

The key word is *clean*. CI eliminates "works on my machine" because it never inherits anything from a developer's local environment. If it passes CI, it is verified to work from a fresh checkout on a neutral machine.

### What "clean machine" means in practice

When a GitHub Actions job starts, GitHub spins up a brand-new Ubuntu virtual machine. That machine has:
- The operating system and pre-installed tools (Node.js if you add `setup-node`, etc.)
- Nothing from your local machine
- No `node_modules/` — not installed until you run `npm ci`
- No compiled output — no `dist/`, no `.next/`, no Prisma client
- No `.env` files — environment variables must be declared in the workflow

Every file that a job needs must be either checked out from git, installed as a dependency, or explicitly generated as a step. If you skip a step, the next step fails.

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

**Runner** — the virtual machine GitHub spins up to execute a job. This repo uses `ubuntu-latest` — a fresh Ubuntu VM that is destroyed after the job finishes. Nothing persists between runs or between jobs.

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

Jobs that share the same `needs` value run **in parallel**:

```yaml
  test-api:
    needs: quality     # runs at the same time as test-web

  test-web:
    needs: quality     # runs at the same time as test-api
```

---

## This Repo's Pipeline

```
push to main / open PR
         │
         ▼
   ┌─────────────┐
   │   quality   │  format:check + lint + typecheck (all apps + packages)
   └──────┬──────┘
          │ passes
          ▼
   ┌──────────────────┐    ┌──────────────────┐
   │   test-api       │    │   test-web       │
   │  (Jest, API)     │    │  (Vitest, web)   │
   └──────────┬───────┘    └────────┬─────────┘
              │ both pass            │
              └──────────┬───────────┘
                         ▼
                  ┌─────────────┐
                  │    build    │  nest build + next build
                  └─────────────┘
```

`test-api` and `test-web` run in parallel — they are independent and do not share state.

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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
          restore-keys: ${{ runner.os }}-node-
      - run: npm ci
      - run: npm run prisma:generate
        working-directory: apps/api
      - run: npx turbo run format:check lint typecheck

  test-api:
    name: Test (API)
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
          restore-keys: ${{ runner.os }}-node-
      - run: npm ci
      - run: npm run prisma:generate
        working-directory: apps/api
      - run: npx turbo run build --filter="./packages/**"
      - run: npm run test:ci
        working-directory: apps/api
      - uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          directory: apps/api/coverage
          flags: api
          fail_ci_if_error: false

  test-web:
    name: Test (Web)
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
          restore-keys: ${{ runner.os }}-node-
      - run: npm ci
      - run: npx turbo run build --filter="./packages/**"
      - run: npm run test:ci
        working-directory: apps/web
      - uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          directory: apps/web/coverage
          flags: web
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test-api, test-web]
    env:
      NEXT_PUBLIC_API_URL: http://localhost:3000/api/v1
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
          restore-keys: ${{ runner.os }}-node-
      - run: npm ci
      - run: npm run prisma:generate
        working-directory: apps/api
      - run: npx turbo run build
```

---

## What each job actually does — step by step

### `quality` job

This job is the gatekeeper. Everything else depends on it passing.

**Step: `actions/checkout@v4`**  
Git clones the repository into the runner's working directory. At this point the machine has only source files — no `node_modules`, no `dist/`, no generated code.

**Step: `actions/setup-node@v4`**  
Installs the specified Node.js version into PATH. Without this, `npm` and `node` would be unavailable or would be whatever version the runner happened to have pre-installed.

**Step: `actions/cache@v4` (restore)**  
Looks up a cache entry keyed on `runner.os + hashFiles('package-lock.json')`. If the lockfile hasn't changed since the last run, the entire `node_modules/` directory is restored from the cache in seconds instead of being downloaded from npm. If the lockfile changed (a package was added or updated), the cache is a miss and a fresh install runs.

**Step: `npm ci`**  
Installs all dependencies from `package-lock.json` exactly. In a cache hit, this is near-instant because `node_modules/` is already there. In a cache miss it downloads everything from npm. `npm ci` always deletes `node_modules` first and reinstalls from scratch — this is intentional, it ensures the lockfile is the source of truth, not whatever happened to already be in the directory.

**Step: `prisma generate`**  
Reads `prisma/schema.prisma` and generates the Prisma client into `node_modules/@prisma/client`. This must happen before TypeScript compilation because `apps/api` imports from `@prisma/client` and TypeScript needs those types to exist. It reads `DATABASE_URL` from the environment — the workflow sets it to a placeholder value because `prisma generate` only needs the schema structure, not an actual database connection.

**Step: `npx turbo run format:check lint typecheck`**  
Runs three tasks across all packages in the monorepo. Crucially, `lint` and `typecheck` are configured in `turbo.json` with `"dependsOn": ["^build"]`. The `^` prefix means "build the dependencies of this package first". So before Turbo runs `lint` for `apps/api`, it automatically runs `build` for `packages/schemas` and `packages/types`, producing their `dist/` output. TypeScript in `apps/api` then successfully resolves `@grow-logs/schemas` because `dist/index.js` now exists.

### `test-api` and `test-web` jobs

These jobs run in parallel after `quality` passes. Each is its own fresh VM — no files carry over from `quality`.

**Steps: `checkout`, `setup-node`, `cache`, `npm ci`, `prisma generate`**  
Identical setup to `quality`. Every job must set itself up from scratch. The cache makes `node_modules/` fast, but all generated output (`dist/`, Prisma client, `.next/`) must be recreated.

**Step: `npx turbo run build --filter="./packages/**"`** *(critical — and the source of Issue 004)*  
This is the step that was missing before Issue 004. Unlike `quality`, the test jobs run their test command directly via `npm run test:ci`, which bypasses Turbo entirely. Without Turbo, nothing builds `packages/schemas`. Jest then tries to resolve `@grow-logs/schemas`, follows the symlink to `packages/schemas/`, reads `"main": "dist/index.js"`, finds no `dist/` directory, and throws "Cannot find module".

`--filter="./packages/**"` tells Turbo to only build packages in the `packages/` directory — not `apps/api` or `apps/web`. This takes seconds and produces `packages/schemas/dist/` and `packages/types/dist/`, which is everything Jest needs.

**Step: `npm run test:ci`**  
Runs Jest (API) or Vitest (web) with `--coverage`. The test framework loads source files, resolves imports, runs test suites, and writes coverage data to `coverage/`.

**Step: `codecov/codecov-action@v4`**  
Reads the `coverage/` directory (which contains `lcov.info` generated by the test runner) and uploads it to Codecov. `fail_ci_if_error: false` means the job does not fail if the Codecov upload itself fails — the test results are what matter.

### `build` job

Runs after both test jobs pass. Verifies the full production build compiles successfully. This is the final gate before code could ever reach a deployment pipeline.

`NEXT_PUBLIC_API_URL` is set here because Next.js reads it at build time, embedding it into the client bundle. Without it, the `env.ts` Zod validation fails and the build exits non-zero.

`npx turbo run build` builds all packages and apps in the correct order (packages first, then apps, based on the dependency graph in `turbo.json`).

---

## Key decisions explained

### `npm ci` instead of `npm install`

`npm install` may update `package-lock.json` if dependency resolution produces a different result. `npm ci` does a clean install using exactly what `package-lock.json` specifies. CI should always reproduce a known-good state.

### `node_modules` caching

Installing dependencies is the slowest step. The cache is keyed on `hashFiles('package-lock.json')` — if the lockfile changes (a dependency was added or updated), the cache is invalidated and a fresh install runs. Otherwise the cached `node_modules` is restored in seconds.

### Why every job repeats the same setup steps

Jobs run on separate VMs. There is no shared filesystem. `quality` installing `node_modules` has no effect on `test-api` — they are on different machines. Each job must set itself up independently. The cache makes this cheap (a cache hit restores `node_modules/` in ~10 seconds instead of ~60 seconds), but the steps cannot be skipped.

### Turborepo in CI

`TURBO_TOKEN` and `TURBO_TEAM` enable the Vercel remote cache. After the first CI run, subsequent runs with the same inputs skip re-execution and download cached artifacts instead. You can verify this by looking for `Remote caching enabled` and `Cached: N cached, N total` in the CI logs.

Turborepo uses content hashing, not timestamps: if the source files that a task reads haven't changed, the task is a cache hit regardless of when it last ran.

### `DATABASE_URL` as an env var

The unit test setup file (`test/jest.setup-env.ts`) sets environment variables so tests don't need a real database. But `prisma generate` reads `prisma.config.ts` which references `process.env['DATABASE_URL']`. The workflow sets it to a placeholder so the generate step doesn't throw.

### No e2e tests in CI yet

E2e tests require a running PostgreSQL container. That complexity is added later once there are real business modules with meaningful database interactions to test. The unit tests run without a database because `jest.setup-env.ts` provides all required env vars including a fake `DATABASE_URL`.

---

## Monorepo dependency ordering in CI

This is where monorepo CI gets genuinely tricky and different from single-app CI.

In a single-app repository, running tests is straightforward: install dependencies, run tests. In a monorepo with workspace packages, running tests for an app requires that all packages the app imports from are compiled first — their `dist/` directories must exist.

### How Turbo solves this automatically

When you run a task through Turbo, it reads `turbo.json` to understand the dependency graph. `"dependsOn": ["^build"]` tells Turbo: "before running this task for package X, build all of X's workspace dependencies". Turbo handles the ordering automatically.

```
turbo run test:ci
  → sees apps/api depends on packages/schemas
  → runs packages/schemas:build first
  → then runs apps/api:test:ci
```

### When you bypass Turbo

When you run `npm run test:ci` directly (as the CI `test-api` job does), you get only Jest. Jest does not read `turbo.json`. It does not know that `packages/schemas` needs to be built first. It just runs tests and fails when it cannot resolve an import.

The solution is to explicitly add the prerequisite steps. In this repo:

```yaml
- name: Build shared packages
  run: npx turbo run build --filter="./packages/**"
```

This gives you Turbo's dependency resolution for the build step, then lets Jest run independently for the test step. You get the best of both: Turbo handles the compilation graph, Jest handles the test execution.

### The general rule

If a task reads `dist/` output from a workspace package, either run the task through Turbo (so `dependsOn` handles ordering), or explicitly build the workspace packages in a preceding step. Never assume `dist/` exists on a fresh machine.

---

## Branch Protection

CI alone doesn't block bad code from merging — it only reports. Branch protection makes it enforceable:

GitHub → Repository Settings → Branches → Add rule → `main`:
- ✅ Require status checks to pass before merging → select `Quality`, `Test (API)`, `Test (Web)`, `Build`
- ✅ Require branches to be up to date before merging

After this, no PR can be merged to `main` without a green CI run on all four jobs.

---

## Interview Summary

**Q: What is CI and why does it matter?**  
CI runs your quality checks automatically on every push using a clean machine. It eliminates "works on my machine" and ensures no broken code can land in the main branch. The clean machine part is critical — it means the build is always reproducible, not dependent on anyone's local environment.

**Q: What is the difference between a job and a step in GitHub Actions?**  
A step is one command or action within a job. A job is a group of steps that run on the same machine. Jobs can run in parallel or be chained — in this repo, `test-api` and `test-web` run in parallel after `quality`, and `build` only runs after both pass.

**Q: Why does every job repeat the same checkout and install steps?**  
Because each job runs on a separate, isolated virtual machine. There is no shared filesystem between jobs. `quality` installing `node_modules` has no effect on `test-api` — they are on different machines. Each job must fully set up its own environment from scratch.

**Q: Why use `npm ci` instead of `npm install` in CI?**  
`npm ci` installs exactly what `package-lock.json` specifies, ensuring reproducibility. `npm install` can silently update the lockfile if resolution produces different results. In CI you want deterministic installs, not opportunistic updates.

**Q: What is a GitHub Actions secret?**  
An encrypted value stored in GitHub repository settings. It is never exposed in logs and is only available to workflow runs on the repository. Used for tokens like `TURBO_TOKEN`, `CODECOV_TOKEN` — values that must not appear in the source code.

**Q: Why do monorepo test jobs need to build shared packages before running tests?**  
Workspace packages point their `"main"` to `dist/index.js`. On a fresh CI machine, `dist/` doesn't exist — it's in `.gitignore`. If you run Jest directly without building the packages first, the module resolver can't find the compiled output and every import from a workspace package fails. The fix is to build workspace packages before running tests, either by going through Turbo (which handles `dependsOn` automatically) or with an explicit build step.
