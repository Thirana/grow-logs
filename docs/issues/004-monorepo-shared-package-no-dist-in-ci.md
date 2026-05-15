# Issue 004 — CI fails with "Cannot find module '@grow-logs/schemas'" even though tests pass locally

**Date:** 2026-05-15  
**Context:** Running the `test-api` job in GitHub Actions after wiring `packages/schemas` into `apps/api` controllers

---

## What happened

`npm run test:ci` in `apps/api` passed locally but failed in the GitHub Actions `Test (API)` job with:

```
FAIL src/modules/auth/auth.controller.spec.ts
  ● Test suite failed to run

    Cannot find module '@grow-logs/schemas' from 'modules/auth/auth.controller.ts'

    Require stack:
      modules/auth/auth.controller.ts
      modules/auth/auth.controller.spec.ts

      23 | import {
         | ^
      24 |   changePasswordSchema,
      25 |   loginSchema,
      26 |   registerSchema,

      at Resolver._throwModNotFoundError (../../../node_modules/jest-resolve/build/index.js:863:11)
```

The same error appeared for `users.controller.spec.ts` which imports `updateUserSchema`. All other test suites passed — only the ones that imported from `@grow-logs/schemas` via a controller failed.

---

## Background: how npm workspaces resolve shared packages

`@grow-logs/schemas` is a local workspace package defined in `packages/schemas/`. When you list it as a dependency in `apps/api/package.json`:

```json
"dependencies": {
  "@grow-logs/schemas": "*"
}
```

npm does not install it from the registry. Instead it creates a symlink in `apps/api/node_modules/@grow-logs/schemas` → `packages/schemas`. Node follows that symlink and reads the package's `package.json` to find the entry point:

```json
{
  "name": "@grow-logs/schemas",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

`"main": "dist/index.js"` is what Node (and Jest's module resolver) follow to actually load the code. If `dist/` does not exist, the import fails with "Cannot find module".

---

## Root cause: CI is a clean checkout — no `dist/` exists

Every CI job runs on a fresh Ubuntu virtual machine that checks out only the git repository. The repository tracks source files (`src/`) but not compiled output (`dist/` and `node_modules/` are both in `.gitignore`).

Locally, the `dist/` directory exists because at some point you ran `npm run build` or `turbo run build`. The test then works because Node finds the compiled files.

In CI, `dist/` is never created. The test job installed dependencies (`npm ci`) and generated the Prisma client, but never compiled `packages/schemas`. So when Jest loaded `auth.controller.ts` and hit the `import { registerSchema } from '@grow-logs/schemas'` line, Node followed the symlink, read `package.json`, tried to open `dist/index.js`, and found nothing there.

---

## Why the `quality` job did not have this problem

The `quality` job runs:

```yaml
run: npx turbo run format:check lint typecheck
```

`lint` and `typecheck` are configured in `turbo.json` with:

```json
"lint": {
  "dependsOn": ["^build"]
},
"typecheck": {
  "dependsOn": ["^build"]
}
```

The `^build` means "before running this task, run the `build` task for all of this package's dependencies". Turbo therefore automatically builds `packages/schemas` (and `packages/types`) before running lint or typecheck for any app that depends on them. By the time `tsc` runs for `apps/api`, `packages/schemas/dist/` already exists.

The `test-api` job bypassed Turbo entirely:

```yaml
run: npm run test:ci
working-directory: apps/api
```

`npm run test:ci` is just Jest — it has no knowledge of Turbo's dependency graph and will not build anything before running. There is no `^build` equivalent in Jest.

---

## Fix

Add a step to build all packages in `packages/` before running the test command in both `test-api` and `test-web` jobs:

```yaml
- name: Build shared packages
  run: npx turbo run build --filter="./packages/**"

- name: Run API unit tests with coverage
  run: npm run test:ci
  working-directory: apps/api
```

`--filter="./packages/**"` restricts Turbo to only build workspace packages under `packages/`, not the full apps. Building just `packages/schemas` and `packages/types` takes a few seconds and produces the `dist/` that Jest's module resolver needs.

---

## How to avoid next time

Any time a test imports from a workspace package whose `"main"` points to `dist/`, that package must be built before the test can run. This is easy to miss locally because `dist/` already exists from a previous build.

**Checklist before writing a CI test job:**
- Identify every workspace package imported by the code under test
- Check that package's `"main"` field — if it points to `dist/`, a build step is required before tests
- Use `npx turbo run build --filter="./packages/**"` to build all shared packages in one step

**The general rule:** if you bypass Turbo (e.g., `npm run test:ci` directly instead of `npx turbo run test:ci`), you lose Turbo's automatic `dependsOn` resolution. You are responsible for running the prerequisite steps yourself.
