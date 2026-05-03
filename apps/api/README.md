# grow-logs API

NestJS + Prisma bootstrap for the grow-logs backend. Production-quality baseline runtime — not a starter template.

## Local Setup

1. Copy `.env.example` to `.env` and fill in values
2. `npm run db:up` — start PostgreSQL via Docker
3. `npm run prisma:migrate:dev` — apply migrations
4. `npm run start:dev` — start the dev server

Swagger UI: http://localhost:3000/api

## Prisma

```bash
npm run prisma:generate          # Regenerate the Prisma client
npm run prisma:migrate:dev       # Create and apply a new migration (dev)
npm run prisma:migrate:deploy    # Apply pending migrations (production)
npm run prisma:studio            # Open Prisma Studio
```

## Docker

```bash
npm run db:up     # Start the PostgreSQL container
npm run db:down   # Stop the PostgreSQL container
npm run db:reset  # Stop and wipe the database volume
```

## Logging

- `LOG_FORMAT=pretty` (default in development) — colorized, human-readable output
- `LOG_FORMAT=json` (default in production) — structured JSON output

## Code Quality

```bash
npm run lint           # ESLint (code quality only)
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier format
npm run format:check   # Prettier check (CI mode)
npm run typecheck      # TypeScript type check (no emit)
```

## Verification

Run these in order before marking any task complete:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand  # requires running PostgreSQL
```
