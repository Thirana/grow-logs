# Project Context

This file exists to give any AI coding agent immediate, complete context about this project without needing to read the entire codebase. Update this file as the project progresses.

---

## What This Is

Grow Logs is a personal growth logging SaaS. Users track daily work and learning activities organised by self-defined categories and sub-categories. Each entry has a type (WORK or LEARNING), free text in markdown, an optional productivity score (1 to 10), and a user-assigned date. The dashboard shows recent entries and an activity summary broken down by category.

---

## Current Phase

**Overall status:** Implementation in progress.

**Last completed step:** Step 04 — NestJS Bootstrap

**Next step:** Step 05 — Prisma Full Schema + Migrations + Seeds
`docs/phases/backend/mvp/steps/step-05-prisma-schema.md`

**Progress:** 4 / 26 steps complete
See full step index: `docs/phases/backend/mvp/PHASES.md`

---

## Key Design Decisions

See DECISIONS.md for full reasoning behind every decision. Summary:

- Custom JWT authentication using Passport.js, not Clerk
- Prisma as ORM over TypeORM
- PostgreSQL as the database
- Zod schemas shared between frontend and backend via packages/schemas
- Markdown stored as plain TEXT in the database
- Role-based access: USER and ADMIN roles on the users table
- Subscription status kept separate from role on the users table
- Category limits (max 5 per user) enforced at application level, not database level
- Composite unique constraints on categories and subcategories
- Hard deletes at MVP stage, soft delete added later via migration
- Custom feature flags implementation via a database table
- Entry text supports markdown, rendered client side

---

## Documentation Index

| File | Contents |
|---|---|
| docs/PRODUCT.md | Problem statement, target user, all user stories (MVP and non-MVP) |
| docs/ARCHITECTURE.md | System design, component diagram, auth flow, request lifecycle |
| docs/SCHEMA.md | All database tables, indexes, constraints, full Prisma schema |
| docs/API_CONTRACT.md | All endpoints, request and response shapes, status codes |
| DECISIONS.md | Every technical decision with reasoning |

---

## Application Structure

```
apps/web         Next.js frontend (App Router, TypeScript, Tailwind, shadcn/ui)
apps/api         NestJS backend (TypeScript, Prisma, Passport.js, Swagger)
packages/types   Shared TypeScript interfaces used by both apps
packages/schemas Shared Zod validation schemas used by both apps
```

---

## Backend Module Structure

```
AuthModule          Register, login, email verification, JWT strategy, password change
UsersModule         User profile management
CategoriesModule    Main categories and subcategories CRUD
EntriesModule       Log entry CRUD and summary analytics
OnboardingModule    Onboarding completion logic
EmailModule         AWS SES integration and email templates
FeatureFlagsModule  Feature flag checks with 60 second in-memory caching
AdminModule         Admin-only user management and feature flag toggling
CommonModule        Shared guards, pipes, interceptors, decorators, response transformer
```

---

## Database Tables

Five tables: users, categories, subcategories, entries, feature_flags.

Full schema with all columns, indexes, constraints, foreign keys, delete behaviours, and complete Prisma schema definition is in docs/SCHEMA.md.

---

## API Summary

Base URL in development: http://localhost:3000/api/v1

24 endpoints across six resource groups: auth, users, onboarding, categories, entries, admin.

All endpoints return a consistent response envelope. Full API contract with all request shapes, response shapes, and error codes is in docs/API_CONTRACT.md.

---

## Key API Design Rules

- Every response uses the same envelope: { data, meta } for success, { statusCode, message, errors } for errors
- All list endpoints are paginated from day one
- All endpoints are versioned under /v1
- Every query is scoped by authenticated user ID — users can never access each other's data
- Admin endpoints require ADMIN role enforced by RolesGuard

---

## Environment Configuration

Three environments: development (local), staging (AWS), production (AWS).

Environment variables are validated at startup using @nestjs/config with a Zod validation schema. The application refuses to start if any required variable is missing.

Environment variable reference files: apps/api/.env.example and apps/web/.env.example.

---

## What Has Been Decided and Should Not Change Without Discussion

- The five database tables and their structure
- The API endpoint list and response envelope shape
- The monorepo folder structure
- The full tech stack

## What Is Still To Be Decided

- Exact AWS infrastructure configuration (ECS task sizing, VPC setup, load balancer)
- Stripe pricing tiers and plan names
- Email template content and copy
- Specific UI layout and component decisions
- Deployment pipeline configuration