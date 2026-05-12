# 01 — Monorepos and Turborepo

**Phase:** Phase 1–2 | **Concepts:** Monorepo, npm workspaces, Turborepo, local cache, remote cache

---

## What is a Monorepo?

A **monorepo** (monolithic repository) is a single Git repository that contains multiple distinct projects — called **packages** or **workspaces** — managed together.

The alternative is a **polyrepo**: one Git repository per project. Most teams start with polyrepos and eventually feel the friction.

```
Polyrepo (separate repos):
  github.com/you/api        ← NestJS backend
  github.com/you/web        ← Next.js frontend
  github.com/you/schemas    ← shared Zod schemas (duplicated in both!)

Monorepo (one repo):
  github.com/you/grow-logs
    apps/api                ← NestJS backend
    apps/web                ← Next.js frontend
    packages/schemas        ← shared Zod schemas (one source of truth)
    packages/types          ← shared TypeScript interfaces
```

### Why use a monorepo?

| Problem in polyrepo | How monorepo solves it |
|---|---|
| Shared code is duplicated or published as an npm package | Import directly via workspace paths — no publish step |
| Keeping frontend and backend schema in sync is manual | One `packages/schemas` file, imported by both |
| A change spanning multiple repos needs multiple PRs | One atomic commit, one PR, one review |
| Dependency versions drift across repos | All packages share the same `node_modules` tree |
| CI needs to be configured per repo | One pipeline covers everything |

### The trade-off

The main downside is **build time**. If you have 10 packages and change one, naively re-running `build` + `test` on all 10 is slow. This is exactly the problem Turborepo solves.

---

## npm Workspaces

npm workspaces are the foundational mechanism that makes a monorepo work with npm. They tell npm that this repository contains multiple packages and should share a single `node_modules` at the root.

```json
// Root package.json
{
  "name": "grow-logs",
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

With this, running `npm install` at the root installs dependencies for **all** packages. Each workspace can then import from another using its package name:

```json
// apps/api/package.json
{
  "name": "@grow-logs/api",
  "dependencies": {
    "@grow-logs/schemas": "*"   // * means "whatever version is in this repo"
  }
}
```

```typescript
// apps/api/src/some-file.ts
import { CreateEntrySchema } from '@grow-logs/schemas';
// resolves to packages/schemas/src/... — no npm publish needed
```

npm symlinks the workspace packages into `node_modules` so imports resolve correctly.

---

## What is Turborepo?

Turborepo is a **build orchestration tool** designed for monorepos. It sits on top of npm workspaces and adds two critical features: **task parallelisation** and **caching**.

Without Turborepo, if you run `npm run build` at the root, npm workspaces runs it sequentially in each package. Turborepo understands the dependency graph between packages and:

1. Runs independent tasks in parallel
2. Skips tasks whose inputs haven't changed (caching)

### Task Pipeline

Turborepo is configured in `turbo.json`. Each entry defines a task and its dependencies:

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],       // build this package only after its dependencies are built
      "outputs": ["dist/**"]         // cache these output directories
    },
    "typecheck": {
      "dependsOn": ["^build"]        // typecheck only after dependencies are built
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "format:check": {
      "cache": false                 // always run fresh — caching a format check makes no sense
    }
  }
}
```

`"^build"` means "run `build` in all packages that this package depends on first." The `^` prefix means "upstream dependencies."

### How Turborepo Decides What to Run

Turborepo computes a **hash** of every task's inputs:
- Source files in the package
- The package's `package.json`
- The outputs of any dependent tasks

If the hash matches a previous run, Turborepo **restores the cached output** instead of re-executing. This is content-based caching — it doesn't care about timestamps, only file contents.

```
turbo run build

  • packages/schemas — hash matches cache → SKIP (restore from cache)
  • packages/types   — hash matches cache → SKIP (restore from cache)
  • apps/api         — src/main.ts changed → EXECUTE (run npm run build)
```

---

## Local Cache vs Remote Cache

### Local Cache

By default, Turborepo stores cached artifacts in `.turbo/cache/` on your local machine. This only helps you — your CI runner and teammates start from scratch each time.

### Remote Cache

With remote caching, the cache is stored in the cloud (Vercel's infrastructure in this project). Every machine — your laptop, your CI runner, your teammate's laptop — shares the same cache.

```
You push a commit. CI runs:
  • npm run build  → hash matches your local build → download from Vercel cache → done in 2s

Your teammate pulls the branch:
  • npm run build  → same hash → download from Vercel cache → done in 2s
  → Neither of them re-compiled anything
```

### How Remote Cache is Configured in This Repo

```bash
# One-time setup — links the repo to Vercel's remote cache
npx turbo login
npx turbo link
```

This writes `.turbo/config.json` with the Vercel team ID. In CI, two environment variables authenticate the connection:

```yaml
# .github/workflows/ci.yml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}  # Vercel personal access token
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}   # Vercel team slug
```

When these are set, Turborepo automatically reads and writes to the Vercel remote cache. No code changes are needed — it's transparent.

You can verify it's working by looking at the CI logs:

```
• Remote caching enabled
Tasks:   5 successful, 5 total
Cached:  5 cached, 5 total        ← all tasks restored from cache
  Time:  1.2s >>> FULL TURBO      ← nothing was re-executed
```

---

## This Repo's Structure

```
grow-logs/
├── apps/
│   ├── api/          @grow-logs/api    — NestJS backend
│   └── web/          @grow-logs/web    — Next.js frontend (future)
├── packages/
│   ├── schemas/      @grow-logs/schemas — shared Zod schemas
│   └── types/        @grow-logs/types   — shared TypeScript interfaces
├── package.json      — workspace root, defines workspaces
├── turbo.json        — Turborepo pipeline
└── .turbo/           — local cache and Vercel team config (gitignored)
```

---

## Interview Summary

**Q: What is a monorepo and why would you use one?**
A single Git repository containing multiple projects. You use it when projects need to share code — instead of publishing shared packages to npm and versioning them separately, you import them directly. Everything stays in sync because there is one source of truth. The main cost is build time, which tools like Turborepo address.

**Q: What does Turborepo do that npm workspaces doesn't?**
npm workspaces handles the dependency linking and installation. Turborepo adds task orchestration: it runs tasks in the correct order based on the dependency graph, runs independent tasks in parallel, and caches results based on content hashes. Without it, you re-run everything on every change even if nothing relevant changed.

**Q: What is remote caching?**
Instead of each machine having its own isolated Turborepo cache, the cache is stored in the cloud and shared. When CI runs a build that you already ran locally with the same inputs, it downloads the cached output instead of recompiling. This can turn multi-minute CI steps into seconds.
