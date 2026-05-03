# Project Agent Guide

Use the existing bootstrap runtime shape as the default operating model for this repo.

## Local Deltas

- DB adapter: Prisma with PostgreSQL
- Swagger: enabled at `/api`
- Readiness target: PostgreSQL via Prisma (`SELECT 1`)
- Local logging: `LOG_FORMAT=pretty`
- Production logging: `LOG_FORMAT=json`
- Formatting: Prettier
- Linting: ESLint (code quality only, no formatting rules)

## Required Verification Commands

Run in this order before marking any task complete:

1. `npm run format:check`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm test -- --runInBand`
6. `npm run test:e2e -- --runInBand`

## Rules

- Preserve the shared bootstrap behavior unless explicitly asked to change it.
- Keep business modules and domain rules out of the shared bootstrap layer.
- Do not introduce auto-sync database behavior.
- Do not enable global implicit request conversion.
- All TypeScript must be strict-mode compatible. Use `unknown` in `catch` clauses.
- Do not use `console.log` in application code — use the injected logger.
- Add project-specific notes below this line when they appear.
