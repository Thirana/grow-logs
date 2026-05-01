# Step 01 — Monorepo Root Scaffold

**Phase:** Phase 1 — Turborepo Monorepo Scaffold
**Depends on:** Nothing. This is the first step.

---

## What

Create the root of the Turborepo monorepo. This step produces no application code — only the scaffolding that holds all workspaces together and lets Turborepo orchestrate tasks across them.

---

## Why

A monorepo lets `apps/api` and `apps/web` share TypeScript types and Zod validation schemas from `packages/schemas` and `packages/types` without duplicating them. Turborepo adds build caching and parallel task execution on top of npm workspaces — so `npm run build` only rebuilds packages that changed since the last run.

Setting this up first means every subsequent step works inside the correct workspace context from the beginning. Retrofitting a monorepo structure onto an existing standalone project is significantly harder.

---

## Deliverables

- `package.json` at repo root — defines npm workspaces pointing at `apps/*` and `packages/*`, no dependencies of its own
- `turbo.json` — pipeline config defining `build`, `test`, `lint`, `typecheck` tasks with correct dependency ordering (`"dependsOn": ["^build"]` for build)
- `tsconfig.base.json` at repo root — strict TypeScript base config that all workspaces extend (strict mode, no implicit any, no implicit returns, consistent casing)
- `.nvmrc` — Node.js major version pinned (resolve latest LTS from nodejs.org at time of generation)
- `.gitignore` — covers `node_modules`, `dist`, `.env`, `.turbo`, `coverage`, `prisma/generated`
- `apps/api/.gitkeep` and `apps/web/.gitkeep` — placeholder files so the directories are committed
- `packages/schemas/.gitkeep` and `packages/types/.gitkeep` — placeholders until Step 02

---

## Key Decisions

**npm workspaces over Yarn/pnpm:** The project uses npm throughout. Turborepo supports all three; npm workspaces are sufficient for this project size and avoids introducing a second package manager.

**`tsconfig.base.json` at root, not inside packages:** Each workspace `tsconfig.json` will extend `../../tsconfig.base.json`. This single source of truth ensures strict mode is never accidentally turned off in one workspace.

**No root-level `dependencies`:** Root `package.json` only has `devDependencies` (Turborepo itself). Application dependencies live in their own workspace `package.json` files.

---

## Done When

- Running `npx turbo run build` from the repo root completes without errors (even with empty workspaces)
- `apps/`, `packages/` directories exist
- `tsconfig.base.json` is present and valid
