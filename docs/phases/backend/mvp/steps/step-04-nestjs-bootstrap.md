# Step 04 — NestJS Bootstrap

**Phase:** Phase 2 — NestJS Bootstrap + Prisma Schema
**Depends on:** Step 02 (shared packages must be wired before bootstrapping `apps/api`)

---

## What

Scaffold the full NestJS application inside `apps/api` using `NESTJS_BOOTSTRAP_PLAYBOOK.md` as the source of truth. At the end of this step the server boots, health endpoints respond, the response envelope works, and all infrastructure middleware is in place — but no business modules or database schema yet.

---

## Why

The bootstrap is the hardest step to retrofit. The request lifecycle ordering (Helmet → CORS → request ID → validation pipe → interceptors → exception filter) must be established correctly from the beginning. Adding these layers to an existing codebase risks subtle bugs — for example, adding Helmet after the request ID middleware means security headers are applied after request context is already set.

This step is intentionally separated from the Prisma schema (Step 05) so that any bootstrap errors are isolated to the server wiring itself, not confused with database migration failures.

**Reference:** `NESTJS_BOOTSTRAP_PLAYBOOK.md` at the repo root is the authoritative spec for this step. Read it in full before implementing.

---

## Deliverables

Everything specified in `NESTJS_BOOTSTRAP_PLAYBOOK.md`, adapted for the monorepo context:

- Full `apps/api/` directory with NestJS scaffold
- Winston logging (structured JSON in production, pretty console in development)
- Request ID middleware (`x-request-id` header propagation)
- Global `ValidationPipe` with custom `exceptionFactory` — `message` is a string, `errors` is a `string[]`
- `ResponseTransformInterceptor` — wraps all success responses in `{ data, meta }`
- `AppExceptionFilter` — consistent error envelope: `{ statusCode, message, errors, errorCode, requestId, path, timestamp }`
- URI versioning (`/v1/...`)
- Zod env validation at startup (fails fast with a clear error if `DATABASE_URL` is missing)
- Swagger at `/api`
- `GET /v1/health/live` — returns `{ status: "ok", uptime: number }`
- `GET /v1/health/ready` — queries `SELECT 1` via Prisma, returns 503 if DB is unreachable
- Helmet and CORS configured in `configureApp()`
- `compose.yaml` at **repo root** (not inside `apps/api`) — single shared PostgreSQL container for the whole monorepo
- `db:up`, `db:down`, `db:reset` scripts in `apps/api/package.json` reference the root `compose.yaml` via `docker compose -f ../../compose.yaml`

**Env vars introduced in this step:**
- `PORT` (default: 3000)
- `NODE_ENV` (default: development)
- `LOG_LEVEL` (default: info)
- `LOG_FORMAT` (default: pretty in dev, json in production)
- `DATABASE_URL` (required)
- `FRONTEND_URL` (default: http://localhost:3001, used for CORS)

---

## Key Decisions

**`compose.yaml` at repo root, not `apps/api`:** The database is shared across both `apps/api` and any future tooling (e.g. PgHero, migration scripts). A root-level compose file avoids running multiple containers for the same database.

**`bufferLogs: true` in NestFactory:** Nest buffers log messages until the custom Winston logger is wired up. Without this, early bootstrap messages use the default Nest logger instead of Winston — logs are inconsistent in format.

**`process.exit(1)` on bootstrap failure:** If env validation fails or the server can't start, the process must exit with a non-zero code. This causes ECS to mark the task as failed and trigger an alert rather than silently hanging.

**Prisma schema is NOT added in this step:** The bootstrap playbook spec includes a minimal `prisma/schema.prisma` with no business models. The full schema is added in Step 05 to keep this step focused and failure-isolated.

---

## Done When

- `npm run start:dev` inside `apps/api` starts without errors
- `GET http://localhost:3000/v1/health/live` returns 200 with `{ data: { status: "ok", uptime: <number> }, meta: {} }`
- `GET http://localhost:3000/v1/health/ready` returns 200 when Docker Postgres is running, 503 when it is not
- `GET http://localhost:3000/api` opens Swagger UI
- A request to an unknown route returns the standard error envelope with `requestId`, `errorCode`, and `path`
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run test:e2e` all pass
