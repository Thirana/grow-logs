# CLAUDE.md

This file is read automatically by Claude Code at the start of every session.
It provides complete project context and working conventions so you never need to re-explain the project.

---

## Project Overview

**Grow Logs** is a personal growth logging SaaS for developers and self-learners to track daily work and learning activities. Users log entries with categories, an entry type (WORK or LEARNING), optional productivity score (1–10), and markdown text.

For full context see `CONTEXT.md`. For all technical decisions and their reasoning see `DECISIONS.md`.

---

## After Completing Any Step

When a step is fully implemented and all "Done When" criteria are met, update these three files before ending the session. This keeps context accurate for the next session.

**1. `CONTEXT.md` — update the Current Phase section:**
```
Last completed step: Step XX — [title]
Next step: Step XX+1 — [title]
Progress: XX / 26 steps complete
```

**2. `docs/phases/backend/mvp/PHASES.md` — mark the step as complete in the Status column:**
Change `⬜` to `✅` for the completed step row.

**4. `docs/learning/backend/` — create or update a learning doc after every phase:**

At the end of each phase (not every step), add or update the relevant learning doc in `docs/learning/backend/`. Files are prefixed with numbers for ordering. Group related concepts into one file rather than one file per tool.

- If the phase introduces a concept covered by an existing file, add a new section to that file.
- If the phase introduces a genuinely new concept group, create the next numbered file.
- Each doc follows this structure: what it is → why it matters → how it works in this repo (with code examples) → interview summary.

Current learning docs:

| File | Phase | Concepts |
|---|---|---|
| `01-monorepos-and-turborepo.md` | Phase 1–2 | Monorepo, npm workspaces, Turborepo, remote cache |
| `02-dependency-automation.md` | Phase 1 | Dependabot, Renovate |
| `03-github-actions-ci.md` | Phase 2 | CI, GitHub Actions, pipeline structure |
| `04-code-coverage-codecov.md` | Phase 2 | Code coverage, Codecov, thresholds |
| `05-nestjs-request-lifecycle.md` | Phase 2 | Middleware chain, request lifecycle, NestJS architecture |
| `06-structured-logging.md` | Phase 2 | Structured logging, Winston, request ID propagation |
| `07-validation-and-error-handling.md` | Phase 2 | ValidationPipe, Zod, exception filter, error envelope |
| `08-sentry-error-tracking.md` | Phase 2 | Sentry, error monitoring, source maps |
| `09-prisma-migrations.md` | Phase 2 | Prisma migrations, shadow database, migrate dev vs deploy, seeding |
| `10-static-security-analysis.md` | Phase 2 | eslint-plugin-security, static analysis, ReDoS, detect-object-injection false positives |
| `11-authentication-and-authorization.md` | Phase 3–4 | JWT, Passport.js, guards, custom decorators, ownership verification, bcrypt, registration flow, login flow, security patterns |

---

**3. `docs/BACKEND_ENV.md` — update whenever a new environment variable is introduced:**

When any step adds a new environment variable (in `env.validation.ts` and `.env.example`), add a corresponding entry to `docs/BACKEND_ENV.md` before the step is considered complete. Each entry must cover:
- Purpose — what the app uses the variable for
- Valid values — type, allowed options, Zod constraints
- Local vs production guidance — concrete recommended values for each context

**5. Swagger + Postman — update whenever any endpoint is added or modified:**

For every new or changed endpoint, before the step is considered complete:
- Add `@ApiTags`, `@ApiOperation`, `@ApiBody` (required — Swagger cannot infer from Zod schemas), and all relevant response decorators (`@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiUnauthorizedResponse`, `@ApiBadRequestResponse`, etc.) to the controller method
- Add corresponding requests to `docs/postman/grow-logs-api.postman_collection.json` covering the happy path and all documented error cases
- Add any new environment variables needed by the requests to `docs/postman/environments/local.postman_environment.json`

**4. `README.md` — update after every step:**

Update the README at the end of every step, not just milestones. At minimum:
- Update the progress counter in the Status section (`X / 26 steps complete`)
- Add or update any commands introduced by the step (install, dev, build, db, migration, etc.)

Specific additions at milestone steps:

| Milestone step | Additional things to update |
|---|---|
| Step 04 (NestJS bootstrap) | Add `npm run db:up`, `npm run start:dev`, Swagger URL |
| Step 05 (Prisma schema) | Add `npm run prisma:migrate:dev`, `npm run prisma:studio` |
| Step 14 (Auth register) | Note that auth endpoints are available |
| Step 26 (Admin module — final step) | Update status from "In development" to "Backend MVP complete" |

---

## Testing Standards

Unit tests are part of every step — not optional, not deferred. Every new service file must have a corresponding `.spec.ts` file created in the same session as the implementation.

### What to test

| File type | Test it? | What to cover |
|---|---|---|
| `*.service.ts` | **Yes — always** | Every public method: happy path + all thrown exceptions (404, 409, 422) |
| `*.controller.ts` | **Yes** | Route delegation only — verify the controller calls the correct service method with the correct args |
| Guards (`*.guard.ts`) | **Yes** | Both the allow and deny paths |
| Pipes (`*.pipe.ts`) | **Yes** | Valid input passes, invalid input throws with correct message |
| Interceptors (`*.interceptor.ts`) | **Yes** | Output shape is correct, error passthrough works |
| Exception filters (`*.filter.ts`) | **Yes** | Error envelope shape, status codes |
| `*.module.ts` | **No** | Pure DI wiring — nothing to unit test |
| `main.ts`, `instrument.ts` | **No** | Bootstrap files — covered by e2e |
| `*.dto.ts`, `*.entity.ts` | **No** | Plain data shapes — no logic |
| Config files | **No** | Tested implicitly when the app boots |

### How to structure tests

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockDeep<PrismaClient>() },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
  });

  describe('register', () => {
    it('creates a user and returns the response', async () => { ... });
    it('throws ConflictException when email already exists', async () => { ... });
  });
});
```

Mock Prisma using `jest-mock-extended` (`mockDeep<PrismaClient>()`). Never hit a real database in unit tests.

### Coverage targets

| Layer | Target |
|---|---|
| Service files | ≥ 80% line + branch |
| Guards and pipes | ≥ 80% line + branch |
| Controllers | ≥ 70% (delegation logic only) |
| Overall project | Rises naturally as modules are added |

These targets are enforced by Codecov on PRs (patch threshold: 50% minimum on new lines). The project threshold in `codecov.yml` will be raised once Phase 3 tests are in place.

### Current coverage state

As of Step 10, only `health.service.spec.ts` exists. Starting from Phase 3 (CommonModule), every step that adds a service, guard, or pipe must include its spec file before the step is considered complete. The "Done When" criteria implicitly require tests — a step is not done if `npm test` fails or if new service files have 0% coverage.

---

## Engineering Standard

This is a real SaaS product being built to production quality. Every implementation decision should meet the bar of "would a senior engineer at a real SaaS company be comfortable shipping this?"

**What this means in practice:**
- Proper patterns: structured error handling, input validation at system boundaries, ownership scoping on every query, environment-based config, structured logging
- When two valid approaches exist, pick the simpler one unless the more complex one has a clear and explainable production benefit
- No premature abstractions, no over-engineering, no building for hypothetical future requirements
- When using a non-obvious production pattern, add a brief explanation of WHY — this project is also a learning exercise

**What it does not mean:**
- Adding error handling for scenarios that cannot happen
- Backwards-compatibility shims when you can just change the code
- Feature flags or abstractions beyond what the current task requires

---

## Documentation Index

| File | Purpose |
|---|---|
| `CONTEXT.md` | AI-oriented project summary and current state |
| `DECISIONS.md` | Every technical decision with full reasoning |
| `docs/PRODUCT.md` | Problem, target user, all MVP and non-MVP user stories |
| `docs/ARCHITECTURE.md` | System design, request lifecycle, auth flows, data flows |
| `docs/SCHEMA.md` | All DB tables, constraints, indexes, full Prisma schema |
| `docs/API_CONTRACT.md` | All endpoints, request/response shapes, status codes |

**Always check these files before asking the user for clarification.** Most questions about what to build are answered in the docs.

---

## Monorepo Structure

```
grow-logs/
├── apps/
│   ├── api/          NestJS backend
│   └── web/          Next.js frontend
├── packages/
│   ├── schemas/      Shared Zod validation schemas
│   └── types/        Shared TypeScript interfaces
├── CLAUDE.md         (this file)
├── CONTEXT.md
├── DECISIONS.md
└── docs/
```

Managed with **Turborepo** and **npm workspaces**.

---

## Tech Stack

### Backend (apps/api)
- **Runtime:** Node.js with TypeScript
- **Framework:** NestJS
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** Passport.js + JWT (custom, not Clerk)
- **Validation:** Zod (via shared `packages/schemas`)
- **Email:** Resend
- **API Docs:** Swagger via `@nestjs/swagger`

### Frontend (apps/web)
- **Framework:** Next.js (App Router)
- **State:** Zustand (client), React Query (server)
- **Forms:** React Hook Form + Zod
- **UI:** shadcn/ui + Tailwind CSS
- **HTTP:** axios or fetch wrapper with JWT injection

### Shared Packages
- `packages/schemas` — Zod schemas imported by both apps
- `packages/types` — TypeScript interfaces imported by both apps

---

## Development Commands

```bash
# From repo root
npm run dev           # Start all apps in parallel
npm run build         # Build all apps
npm run lint          # Lint all apps
npm run test          # Run all tests

# From apps/api
npm run dev           # Start NestJS in watch mode
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npx prisma migrate dev        # Run pending migrations
npx prisma migrate dev --name <name>  # New migration
npx prisma db seed    # Seed feature flags
npx prisma studio     # Open Prisma Studio
```

---

## Backend Architecture Rules

### Module Structure
Every NestJS module follows this exact structure:
```
modules/
  <feature>/
    <feature>.module.ts
    <feature>.controller.ts
    <feature>.service.ts
    dto/
      create-<feature>.dto.ts
      update-<feature>.dto.ts
      <feature>-response.dto.ts
    entities/
      <feature>.entity.ts
```

### Backend Modules
| Module | Responsibility |
|---|---|
| `AuthModule` | Register, login, email verification, JWT strategy, password change |
| `UsersModule` | User profile management |
| `CategoriesModule` | Categories and subcategories CRUD |
| `EntriesModule` | Log entry CRUD and summary analytics |
| `OnboardingModule` | Onboarding completion logic |
| `EmailModule` | Resend transactional email |
| `FeatureFlagsModule` | Feature flag checks with 60s in-memory cache |
| `AdminModule` | Admin user management and flag toggling |
| `CommonModule` | Guards, pipes, interceptors, decorators, response transformer |

### Request Lifecycle (in order)
1. Middleware (logging, CORS, Helmet)
2. Guards (JWT authentication, RolesGuard for admin)
3. Interceptors (request logging, response transformation)
4. Pipes (Zod validation of body and query params)
5. Controller (route handler, delegates to service)
6. Service (business logic, ownership checks)
7. Prisma (database queries)

---

## API Design Rules

- Base path: `/api/v1`
- Resources are nouns, actions are HTTP methods — never `/getEntries`, always `GET /entries`
- **Every** response uses the standard envelope — no exceptions:

```typescript
// Single resource
{ data: {}, meta: {} }

// List
{ data: [], meta: { total, page, limit, totalPages } }

// Error
{ statusCode, message, errors: [], timestamp, path }
```

- All list endpoints are paginated (default page=1, limit=10, max limit=100)
- Every query is scoped by authenticated user ID — users never access each other's data
- UUIDs in path params are validated as proper UUID format before hitting the database
- Pagination on all list endpoints from day one

### HTTP Status Codes
| Code | When |
|---|---|
| 200 | Successful GET or PATCH |
| 201 | Successful POST that creates a resource |
| 204 | Successful DELETE |
| 400 | Validation failed |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but wrong role |
| 404 | Resource not found or not owned by user |
| 409 | Duplicate resource |
| 422 | Business rule violation |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

---

## Validation Rules

- Validation schemas live in `packages/schemas` and are imported into both the backend (as Zod pipes) and frontend (as form validation)
- Never duplicate a validation rule — define it once in `packages/schemas`
- Backend validates independently of the frontend — never trust client-side validation alone
- Environment variables are validated at startup via `@nestjs/config` with a Zod schema — the app refuses to start if any required variable is missing

### Schema file conventions in `packages/schemas`

`packages/schemas/src/` has two kinds of files:

| File | Purpose |
|---|---|
| `common.ts` | **Base primitive schemas** — reusable building blocks shared across many modules: `uuidSchema`, `paginationSchema`, `dateStringSchema`, and any future primitives (e.g. a score range, a slug pattern). Add new primitives here, not in module-specific files. |
| `<feature>.ts` | **Module-specific schemas** — the full request/response shape for one resource (e.g. `entry.ts`, `category.ts`). These import from `common.ts` and compose the primitives into domain DTOs. |

`packages/schemas/src/index.ts` re-exports everything with `export * from './<file>.js'`. Every new schema file must be added to `index.ts` immediately.

**Rule:** before creating a new schema file, check whether the primitive already exists in `common.ts`. If a new primitive is needed by more than one module, add it to `common.ts`. If it belongs to exactly one module, add it to that module's schema file.

---

## Security Rules

- Passwords hashed with bcrypt, never stored plain
- Access tokens are JWTs, expire after 1 hour
- Refresh tokens are opaque random strings, 7-day rolling window, stored as a bcrypt hash in the `refresh_tokens` table
- Refresh token rotation: every use of a refresh token invalidates the old one and issues a new token with a fresh 7-day window
- Reuse detection: if a refresh token that has already been rotated is presented, delete all refresh tokens for that user immediately (full session wipe)
- Refresh token is delivered and received as an HTTP-only cookie — never in the response body
- All endpoints except register, login, verify-email, and resend-verification require authentication
- Every database query is scoped by `userId` from the JWT — never trust a userId from the request body
- CORS allows requests only from the frontend domain
- Rate limiting on authentication endpoints via NestJS throttler
- Helmet.js sets secure HTTP headers
- Admin endpoints require both JWT guard AND RolesGuard
- Raw error internals are never exposed to the client — always wrap in the standard error envelope
- On login failure, always return a generic error without specifying which field (email or password) was wrong

---

## Database Rules

- All primary keys are UUIDs generated at application level
- All tables have `created_at` and `updated_at` timestamps
- Hard deletes at MVP — do not add soft delete until explicitly asked
- `entry_date` (user-assigned date) is separate from `created_at` (DB insert timestamp) — dashboard queries always sort/filter by `entry_date`
- `user_id` is denormalised on `subcategories` to avoid a JOIN on ownership checks
- Category limit (max 5 per user) is enforced in `CategoriesService`, not the database
- Migration files are never edited after being applied — every schema change gets its own migration
- Migration names are descriptive: `add_soft_delete_to_entries`, not `migration_001`

### Foreign Key Delete Behaviours
| Relationship | Behaviour |
|---|---|
| users → categories | CASCADE |
| users → subcategories | CASCADE |
| users → entries | CASCADE |
| categories → subcategories | CASCADE |
| categories → entries | RESTRICT |
| subcategories → entries | SET NULL |

---

## Feature Flags

All non-MVP features are gated behind feature flags stored in the `feature_flags` table and cached for 60 seconds in `FeatureFlagsModule`.

| Flag key | Controls |
|---|---|
| `ai_weekly_summary` | AI-generated weekly digest email |
| `github_integration` | GitHub commit and PR auto-import |
| `jira_integration` | Jira ticket auto-import |
| `stripe_billing` | Stripe subscription billing |
| `public_profile` | Shareable public learning profile |
| `resume_export` | PDF resume and performance review export |

All flags default to `false`. Never activate them until explicitly instructed.

---

## Error Handling

- A global exception filter catches all unhandled errors and returns the standard error envelope
- Validation errors (400) are caught by Zod pipes
- Authentication errors (401) are caught by JWT guard
- Business logic errors (404, 409, 422) are thrown explicitly in services
- Unexpected errors (500) are caught by the global filter — internals are logged but never sent to the client
- On the frontend, React Query handles API error states; a global toast notification system displays user-friendly messages

---

## Code Style and Conventions

- TypeScript strict mode enabled everywhere
- No `any` — use proper types or `unknown`
- No comments explaining what the code does — code should be self-documenting via clear naming
- Only add a comment when the WHY is non-obvious (hidden constraint, workaround, non-obvious invariant)
- No unused variables or imports
- File names are kebab-case: `create-entry.dto.ts`, not `CreateEntryDto.ts`
- Class names are PascalCase: `CreateEntryDto`
- All environment variables are UPPER_SNAKE_CASE
- Enums use UPPER_SNAKE_CASE values: `WORK`, `LEARNING`, `USER`, `ADMIN`

---

## What Must Not Change Without Discussion

- The six database tables and their structure
- The API endpoint list and response envelope shape
- The monorepo folder structure
- The full tech stack

## What Is Still To Be Decided

- Exact AWS infrastructure configuration (ECS task sizing, VPC, load balancer)
- Stripe pricing tiers and plan names
- Email template content and copy
- Specific UI layout and component decisions
- Deployment pipeline configuration
