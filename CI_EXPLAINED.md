# What is a CI Pipeline and Why Does This Project Need One?

---

## The Problem It Solves

Right now, when you push code, nothing checks it automatically. You could push broken TypeScript, a failing test, or a lint error and it would land in `main` silently. On a solo project that's annoying. On a team it's a production incident waiting to happen.

A CI (Continuous Integration) pipeline is a script that runs automatically on every push and pull request. It acts as a gatekeeper — it runs all your quality checks and blocks a merge if any of them fail.

---

## The Mental Model

Think of it as a robot that does this every time you push:

```
1. Check out your code on a clean machine
2. Install dependencies
3. Run format:check   ← did you forget to format?
4. Run lint           ← any code quality violations?
5. Run typecheck      ← any TypeScript errors?
6. Run build          ← does it actually compile?
7. Run tests          ← do all tests pass?
8. ✅ Green = safe to merge   ❌ Red = blocked
```

If step 4 fails, steps 5–8 don't run. You get a failing status on the PR and a clear message telling you which step broke.

---

## GitHub Actions Specifically

GitHub Actions is GitHub's built-in CI system. You define pipelines as YAML files in `.github/workflows/`. GitHub runs them on their servers (called "runners") — you don't manage any infrastructure.

### Key concepts

| Term | What it means |
|---|---|
| **Workflow** | The whole pipeline — one `.yml` file |
| **Trigger** | When it runs — on push, on PR, on schedule, manually |
| **Job** | A group of steps that run on one machine |
| **Step** | One command or action within a job |
| **Action** | A reusable step someone published (e.g. `actions/checkout@v4`) |
| **Runner** | The virtual machine GitHub spins up to run your job |
| **Secret** | An encrypted variable stored in GitHub settings — never in code |

### What the runner looks like

Each run starts with a **fresh Ubuntu virtual machine** with nothing on it. The pipeline installs Node, checks out your code, installs dependencies, and runs your commands — exactly as if you did it manually on a clean machine. This is important: it means "works on my machine" excuses disappear. If it passes CI, it passes everywhere.

---

## What Step 06 Will Set Up for This Project

The workflow file will live at `.github/workflows/ci.yml` and run on every push and every pull request to `main`.

### The job sequence

```
push / PR to main
       │
       ▼
┌─────────────────────────────────────┐
│  Job: ci                            │
│                                     │
│  1. Checkout code                   │
│  2. Set up Node 24                  │
│  3. npm ci  (clean install)         │
│  4. Start PostgreSQL service        │
│  5. Run prisma migrate deploy       │
│  6. npm run format:check            │
│  7. npm run lint                    │
│  8. npm run typecheck               │
│  9. npm run build                   │
│ 10. npm test ── runInBand           │
│ 11. npm run test:e2e ── runInBand   │
└─────────────────────────────────────┘
```

### Why PostgreSQL in CI?

The e2e tests (`test:e2e`) hit a real database — they test `GET /v1/health/ready` which runs `SELECT 1` against Postgres. GitHub Actions lets you spin up a PostgreSQL service container alongside your job. It starts automatically, runs for the duration of the job, and tears itself down. No Docker Compose needed.

### `npm ci` vs `npm install`

The pipeline uses `npm ci` not `npm install`:
- `npm ci` deletes `node_modules` and installs exactly what `package-lock.json` specifies
- `npm install` might update `package-lock.json` if versions resolve differently
- CI should always reproduce a known-good state, not discover new versions

---

## Turborepo in CI

This project uses Turborepo. In CI, you can pass `--filter` to only run tasks for packages that actually changed:

```bash
npx turbo run build --filter=[HEAD^1]
```

This means if you only changed `apps/api`, Turborepo skips building `apps/web` and `packages/*`. On a large monorepo this cuts CI time significantly.

Even better: Turborepo has a **remote cache**. Build outputs are stored on Vercel's servers. If the same inputs (source files + dependencies) produce the same output, the cache is hit and the build step is skipped entirely — it downloads the cached artifact instead. This requires two secrets set in GitHub:

| Secret | Purpose |
|---|---|
| `TURBO_TOKEN` | Auth token for Vercel remote cache |
| `TURBO_TEAM` | Your Vercel team slug |

Without these, CI still works — it just rebuilds everything each run.

---

## The Status Badge

Once the workflow exists, you can add a badge to your README:

```md
![CI](https://github.com/Thirana/grow-logs/actions/workflows/ci.yml/badge.svg)
```

This shows green/red in real time on your repo's front page.

---

## What Happens on a Failing CI

Say you push a branch with a TypeScript error:

1. GitHub detects the push
2. A runner starts, installs everything, reaches `npm run typecheck`
3. TypeScript finds the error, exits with code 1
4. The job is marked **failed**
5. GitHub shows a red ✗ on your commit and your PR
6. If you have branch protection rules on `main`, the PR is blocked from merging

You fix the error, push again, the job reruns from scratch and (hopefully) goes green.

---

## Branch Protection (Recommended After Step 06)

Once CI is wired up, go to:
`GitHub → Settings → Branches → Add rule → main`

Enable:
- **Require status checks to pass before merging** → select the `ci` job
- **Require branches to be up to date before merging**

Now no code can land in `main` without passing CI. This is standard practice on any serious codebase.

---

## Summary

| Without CI | With CI |
|---|---|
| Push broken code, find out later | Broken code is caught before merge |
| "Works on my machine" | Runs on a clean machine every time |
| Manual quality checks | Automated on every push |
| Anyone can merge anything | Merges blocked until all checks pass |
| No history of what broke | Full log of every run, every failure |
