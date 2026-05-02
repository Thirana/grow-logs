# Grow Logs

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
| Email | AWS SES |

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
| `docs/phases/backend/mvp/PHASES.md` | Backend implementation phases and step index |

---

## Status

> **In development.** Backend implementation in progress — 2 / 26 steps complete.

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

*Per-app setup instructions (database, environment variables, etc.) will be added as each service is implemented.*
