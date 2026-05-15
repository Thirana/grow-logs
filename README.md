# Grow Logs

![CI](https://github.com/Thirana/grow-logs/actions/workflows/ci.yml/badge.svg)

A personal growth logging SaaS for developers and self-learners to track daily work and learning activities.

Users log entries tagged as **Work** or **Learning**, organised by self-defined categories and sub-categories. Each entry supports markdown, an optional productivity score (1–10), and a user-assigned date. The dashboard surfaces recent activity and a category breakdown so users can see where their time and energy are going.

---

## The Problem

Knowledge workers struggle to recall and articulate what they have actually done over time. Performance reviews, resume updates, and job interviews become unnecessarily hard when there is no record of daily progress. Existing tools like Notion are too heavy and unstructured; plain journals produce no insights. Grow Logs is a lightweight, structured alternative built specifically for this.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Zustand, React Query, shadcn/ui, Tailwind CSS |
| Backend | NestJS, Prisma, PostgreSQL, Passport.js (JWT) |
| Shared | Zod schemas and TypeScript types in shared packages |
| Monorepo | Turborepo with npm workspaces |
| Frontend hosting | Vercel |
| Backend hosting | AWS ECS |
| Database | AWS RDS (PostgreSQL) |
| Email | Resend |

---

## Project Structure

```
grow-logs/
├── apps/
│   ├── api/        NestJS REST API
│   └── web/        Next.js frontend
├── packages/
│   ├── schemas/    Shared Zod validation schemas
│   └── types/      Shared TypeScript interfaces
└── docs/           Architecture, schema, API contract, and implementation phases
```

---

## Documentation

| Document | Contents |
|---|---|
| `docs/PRODUCT.md` | Problem, target user, MVP and non-MVP user stories |
| `docs/ARCHITECTURE.md` | System design, request lifecycle, auth flows |
| `docs/SCHEMA.md` | Database schema, Prisma models, migration strategy |
| `docs/API_CONTRACT.md` | All endpoints, request/response shapes, status codes |
| `docs/BACKEND_ENV.md` | Every backend environment variable — purpose, valid values, local vs production guidance |
| `docs/phases/backend/mvp/PHASES.md` | Backend implementation phases and step index |

### Postman Collection

A Postman collection covering all implemented endpoints lives in `docs/postman/`.

| File | Purpose |
|---|---|
| `docs/postman/grow-logs-api.postman_collection.json` | All requests, organised by module, with test assertions |
| `docs/postman/environments/local.postman_environment.json` | Local dev environment (`http://localhost:3000/api/v1`) |
| `docs/postman/environments/staging.postman_environment.json` | Staging environment (fill in URL when provisioned) |

**To use:**
1. Import the collection and the local environment file into Postman.
2. Run **Auth / Register — happy path** once to create your test account.
3. Run **Auth / Login — happy path** — the post-response script automatically sets `{{ACCESS_TOKEN}}` in the environment.
4. All subsequent requests that require authentication use the stored token via the collection-level Bearer auth.

---

## Status

> **In development.** Backend implementation in progress — 20 / 26 steps complete. Steps 08 and 09 (OpenTelemetry, Axiom) are deferred and will be completed after all other steps.

---

## Local Development

### Prerequisites

- Node.js 24+ (use `.nvmrc` — run `nvm use` if you have nvm)
- npm 10+

### Monorepo commands

Run these from the repo root:

```bash
npm install          # Install all workspace dependencies
npm run build        # Build all packages and apps (Turborepo, only rebuilds what changed)
npm run dev          # Start all apps in parallel (watch mode)
npm run lint         # Lint all packages and apps
npm run typecheck    # Type-check all packages and apps
npm run test         # Run all test suites
```

> Turborepo caches task outputs locally. Re-running `npm run build` after no changes completes in milliseconds.

#### Turborepo Remote Cache (CI)

In CI, Turborepo can share its build cache across runs so unchanged packages are never rebuilt. This requires two secrets set in **GitHub repository Settings → Secrets → Actions**:

| Secret | How to get it |
|---|---|
| `TURBO_TOKEN` | Run `npx turbo login` then `npx turbo link` locally — outputs the token |
| `TURBO_TEAM` | Your Vercel team slug (visible in your Vercel dashboard URL) |

These are injected as environment variables in the GitHub Actions workflow (added in Step 06). Without them the build still works — it just won't use the remote cache.

### Dependency management

- **Renovate Bot** opens weekly PRs to update dependencies. It groups related packages (all `@nestjs/*` in one PR, `prisma` + `@prisma/client` together). Patch and minor dev dependency updates are automerged once CI passes; major updates require manual review.
- **Dependabot** monitors for CVEs and opens targeted security fix PRs independently of the regular update schedule.

### API (`apps/api`)

Run these from `apps/api`:

```bash
# Database (requires Docker)
npm run db:up              # Start PostgreSQL container (defined at repo root: compose.yaml)
npm run db:down            # Stop PostgreSQL container
npm run db:reset           # Stop and wipe the database volume

# Start the dev server
npm run start:dev          # NestJS in watch mode (http://localhost:3000)
```

Swagger UI is available at **http://localhost:3000/api/docs** once the server is running.

```bash
# Prisma
npm run prisma:migrate:dev      # Create and apply a migration (dev)
npm run prisma:migrate:deploy   # Apply pending migrations (production)
npm run prisma:generate         # Regenerate the Prisma client after schema changes
npm run prisma:studio           # Open Prisma Studio (visual DB browser)
npx prisma db seed              # Seed feature flags (idempotent — safe to re-run)
```

Copy `apps/api/.env.example` to `apps/api/.env` and fill in values before starting the server.
