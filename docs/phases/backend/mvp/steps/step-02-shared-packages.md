# Step 02 — Shared Packages Setup

**Phase:** Phase 1 — Turborepo Monorepo Scaffold
**Depends on:** Step 01

---

## What

Initialise `packages/schemas` and `packages/types` as proper npm packages with TypeScript configuration, build scripts, and correct cross-workspace import wiring. Both packages are empty at this step — no schemas or types are defined yet. The goal is that `apps/api` can immediately `import { something } from '@grow-logs/schemas'` once content is added.

---

## Why

**`packages/schemas`** will hold all Zod validation schemas used by both the NestJS backend (as validation pipes) and the Next.js frontend (as form validation). Defining them once here means a change to a field's validation rule is reflected everywhere automatically — no risk of backend and frontend validation drifting apart.

**`packages/types`** will hold shared TypeScript interfaces (API response shapes, enum types) used across both apps. Sharing types from a single package ensures the frontend and backend always agree on what a `User` or `Entry` looks like.

Setting these up as proper packages now — even empty — means every subsequent step can import from them without any configuration changes.

---

## Deliverables

**`packages/schemas/`:**
- `package.json` — name: `@grow-logs/schemas`, main: `dist/index.js`, types: `dist/index.d.ts`, build script using `tsc`
- `tsconfig.json` — extends `../../tsconfig.base.json`, outputs to `dist/`
- `src/index.ts` — empty barrel export file (`export {};`)

**`packages/types/`:**
- `package.json` — name: `@grow-logs/types`, same structure as schemas
- `tsconfig.json` — extends `../../tsconfig.base.json`, outputs to `dist/`
- `src/index.ts` — empty barrel export file (`export {};`)

**Root `package.json` update:**
- Add `@grow-logs/schemas` and `@grow-logs/types` as workspace dependencies in `apps/api/package.json` using the `workspace:*` protocol (or `*` for npm workspaces)

**`turbo.json` update:**
- Ensure `build` task in `apps/api` declares `dependsOn: ["@grow-logs/schemas#build", "@grow-logs/types#build"]` so packages are always built before the app that imports them

---

## Key Decisions

**`workspace:*` vs `*`:** npm workspaces use `"*"` as the version for local packages (e.g. `"@grow-logs/schemas": "*"`). This tells npm to resolve the package from the local workspace rather than the registry.

**Build before import:** TypeScript needs compiled output from `packages/schemas/dist/` to resolve imports in `apps/api`. The Turborepo pipeline dependency ensures this always happens in the right order.

**Zod as a peer dependency in schemas:** `zod` will be a `peerDependency` in `packages/schemas` and a direct `dependency` in `apps/api` and `apps/web`. This avoids bundling multiple Zod instances.

---

## Done When

- `npm install` at repo root resolves all workspace symlinks without errors
- `npx turbo run build` builds both packages (even with empty `index.ts`)
- `apps/api/package.json` lists `@grow-logs/schemas` and `@grow-logs/types` as dependencies
