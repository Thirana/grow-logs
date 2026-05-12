# Backend Implementation Phases

Nine phases broken into **26 granular steps**, each in its own file under `steps/`.
Each step is a single focused unit — one concern, one agent session.

## Step Index

| Step | Title | Phase | Status |
|---|---|---|---|
| [01](steps/step-01-monorepo-root.md) | Monorepo Root Scaffold | Phase 1 | ✅ |
| [02](steps/step-02-shared-packages.md) | Shared Packages Setup | Phase 1 | ✅ |
| [03](steps/step-03-dependency-automation.md) | Dependency Automation | Phase 1 | ✅ |
| [04](steps/step-04-nestjs-bootstrap.md) | NestJS Bootstrap | Phase 2 | ✅ |
| [05](steps/step-05-prisma-schema.md) | Prisma Full Schema + Migrations + Seeds | Phase 2 | ✅ |
| [06](steps/step-06-github-actions-ci.md) | GitHub Actions CI Pipeline | Phase 2 | ✅ |
| [07](steps/step-07-sentry.md) | Sentry Error Tracking | Phase 2 | ✅ |
| [08](steps/step-08-opentelemetry.md) | OpenTelemetry Tracing | Phase 2 | ⬜ |
| [09](steps/step-09-axiom-logging.md) | Axiom Log Shipping | Phase 2 | ⬜ |
| [10](steps/step-10-code-quality-tooling.md) | Code Quality Tooling | Phase 2 | ⬜ |
| [11](steps/step-11-common-zod-validation.md) | CommonModule: Zod Validation Pipe | Phase 3 | ⬜ |
| [12](steps/step-12-common-jwt-guard.md) | CommonModule: JWT Guard + Passport Strategy | Phase 3 | ⬜ |
| [13](steps/step-13-common-roles-ownership.md) | CommonModule: Roles Guard + CurrentUser + Ownership | Phase 3 | ⬜ |
| [14](steps/step-14-auth-register.md) | AuthModule: Register + Email Token | Phase 4 | ⬜ |
| [15](steps/step-15-auth-login.md) | AuthModule: Login + JWT Issuance | Phase 4 | ⬜ |
| [16](steps/step-16-auth-verify-email.md) | AuthModule: Email Verification + Resend | Phase 4 | ⬜ |
| [17](steps/step-17-auth-password-throttler.md) | AuthModule: Change Password + Rate Limiting | Phase 4 | ⬜ |
| [18](steps/step-18-email-ses.md) | EmailModule: AWS SES Integration | Phase 5 | ⬜ |
| [19](steps/step-19-users-module.md) | UsersModule | Phase 6 | ⬜ |
| [20](steps/step-20-onboarding-module.md) | OnboardingModule | Phase 6 | ⬜ |
| [21](steps/step-21-categories-module.md) | CategoriesModule: Categories CRUD | Phase 7 | ⬜ |
| [22](steps/step-22-subcategories-module.md) | CategoriesModule: Subcategories CRUD | Phase 7 | ⬜ |
| [23](steps/step-23-entries-crud.md) | EntriesModule: CRUD | Phase 8 | ⬜ |
| [24](steps/step-24-entries-summary.md) | EntriesModule: Summary Analytics | Phase 8 | ⬜ |
| [25](steps/step-25-feature-flags-module.md) | FeatureFlagsModule | Phase 9 | ⬜ |
| [26](steps/step-26-admin-module.md) | AdminModule | Phase 9 | ⬜ |

`⬜` not started · `✅` complete

---

Phases 6, 7, and 9 can run in parallel once their dependencies are complete.
Post-implementation tooling (SonarQube, Snyk, k6, etc.) is at the bottom of this file.

---

## Phase 1 — Turborepo Monorepo Scaffold

Root monorepo structure with npm workspaces and Turborepo pipeline configuration.

**Delivers:**
- Root `package.json`, `turbo.json`, `.nvmrc`, `.gitignore`
- Shared `tsconfig` base that all workspaces extend
- `packages/schemas` — empty npm package, correctly wired for imports
- `packages/types` — empty npm package, correctly wired for imports
- `apps/api` and `apps/web` directory placeholders

**Tooling set up in this phase:**

| Tool | What it does | Free tier |
|---|---|---|
| **Renovate Bot** | Automatically opens PRs to update dependencies. Understands monorepos — groups all `@nestjs/*` updates into one PR instead of flooding you with individual ones. Smarter than Dependabot for update grouping. | Free via Mend hosted app on GitHub |
| **Dependabot** | Scans dependencies for known CVEs and opens security-fix PRs. Runs on the GitHub Advisory Database. Complements Renovate — Renovate handles version bumps, Dependabot handles security alerts. | Free, built into GitHub |
| **Turborepo Remote Cache** | Caches build outputs remotely so CI only rebuilds packages that changed. Without it, every CI run rebuilds everything from scratch. Vercel hosts the remote cache for free. | Free via Vercel |

Config files added: `.github/dependabot.yml`, `renovate.json`.

**Done when:** `npx turbo run build` runs without errors from the repo root.

---

## Phase 2 — NestJS Bootstrap + Prisma Schema

NestJS application bootstrapped inside `apps/api` using `NESTJS_BOOTSTRAP_PLAYBOOK.md`,
with the full production database schema applied.

**Delivers:**
- Running NestJS server with Winston logging, request ID propagation, URI versioning
- Global exception filter, `{ data, meta }` response envelope, Zod env validation
- Swagger at `/api`
- Full Prisma schema (all 5 tables: users, categories, subcategories, entries, feature_flags)
- Initial database migration applied
- Feature flags seed data inserted
- `GET /v1/health/live` and `GET /v1/health/ready` endpoints

**Tooling set up in this phase:**

| Tool | What it does | Free tier |
|---|---|---|
| **Sentry** (`@sentry/nestjs`) | Captures exceptions with full stack traces, request context, and release tracking. Retrofitting it later means you miss errors in earlier code. Must be initialised before `NestFactory.create()`. | 5,000 errors/month free |
| **OpenTelemetry** (`nestjs-otel`) | Vendor-agnostic distributed tracing and metrics. Instruments NestJS DI, HTTP calls, and Prisma queries automatically. Ships traces to Grafana Tempo (free on Grafana Cloud). Retrofitting distributed tracing across a full codebase is painful — set it up now. | Free (open source); Grafana Cloud free tier covers traces |
| **Axiom** (`@axiomhq/winston`) | Ships your existing Winston logs to a cloud store with search and dashboards. Added as a Winston transport — zero changes to your logging code. Without this, logs disappear when the ECS container restarts. | 500 GB ingest/month, 30-day retention free |
| **GitHub Actions** | CI pipeline that runs lint, typecheck, test, and build on every push and PR. Turborepo's `--filter=[HEAD^1]` flag makes it only run jobs for changed packages. | 2,000 min/month free (private repo) |
| **Codecov** | Tracks Jest test coverage over time and posts a coverage diff on every PR. Configured with one GitHub Actions step after `npm test -- --coverage`. | Free for small teams |
| **`eslint-plugin-security`** | Adds ESLint rules that catch common Node.js security mistakes (unsafe regex, `eval`, unvalidated redirects). Runs as part of your existing lint step — no separate tool to run. | Free (open source) |

**Done when:** Server boots, health endpoints respond, database has all tables, Sentry receives a test event, and GitHub Actions CI passes.

---

## Phase 3 — CommonModule (Shared Infrastructure)

All shared guards, pipes, and decorators that every business module depends on.
No endpoints. Pure infrastructure.

**Delivers:**
- `ZodValidationPipe` — custom pipe that validates request bodies using Zod schemas from `packages/schemas`
- `JwtAuthGuard` — validates JWT on every protected route, attaches user ID to request
- `RolesGuard` — enforces USER / ADMIN role on routes that require it
- `@CurrentUser()` decorator — extracts authenticated user from the request
- Ownership verification utility — reusable helper for confirming a resource belongs to the requesting user
- Base Zod schemas in `packages/schemas` for shared validation rules

**Done when:** Guards and pipes can be imported and applied in any module.

---

## Phase 4 — AuthModule

Full authentication flow. Email delivery handled by a dev-mode stub that logs
the verification URL to the console — no real AWS required.

**Delivers:**
- `POST /v1/auth/register` — creates user, sends verification email (logged to console in dev)
- `POST /v1/auth/login` — validates credentials, returns JWT
- `POST /v1/auth/verify-email` — marks email as verified using the token
- `POST /v1/auth/resend-verification` — resends verification, always returns 200
- `PATCH /v1/auth/change-password` — changes password for authenticated user
- Passport.js JWT strategy wired to `JwtAuthGuard`
- bcrypt password hashing
- Rate limiting on all auth endpoints via `@nestjs/throttler`
- Minimal `EmailModule` stub (logs to console, swapped out in Phase 5)

**Done when:** Full auth flow works end-to-end in development without AWS credentials.

---

## Phase 5 — EmailModule (AWS SES)

Replace the dev-mode email stub with real transactional email via AWS SES.
Nothing else in the app changes — only the delivery mechanism.

**Delivers:**
- `EmailModule` with AWS SES client wired via `@nestjs/config`
- Email template for the verification email
- Conditional rendering: plain console log in `development`, real SES send in `production`
- Required env vars: `AWS_REGION`, `AWS_SES_FROM_ADDRESS`

**Done when:** Verification emails are delivered to a real inbox in staging.

---

## Phase 6 — UsersModule + OnboardingModule

User profile management and onboarding completion. Depends on Phase 4 (auth).

**Delivers:**
- `GET /v1/users/me` — returns authenticated user's profile
- `PATCH /v1/users/me` — updates email (with duplicate check)
- `POST /v1/onboarding/complete` — marks onboarding done, enforces 3-category minimum, returns 409 if already completed

**Done when:** All three endpoints respond correctly with valid JWT.

---

## Phase 7 — CategoriesModule

Full CRUD for categories and subcategories with all business rules enforced.
Depends on Phase 3 (CommonModule).

**Delivers:**
- `GET /v1/categories` — returns all categories with their subcategories
- `POST /v1/categories` — creates a category, enforces max 5 per user
- `PATCH /v1/categories/:id` — renames a category
- `DELETE /v1/categories/:id` — deletes category and subcategories, blocked if entries are attached
- `POST /v1/categories/:id/subcategories` — creates a subcategory
- `PATCH /v1/categories/:id/subcategories/:subId` — renames a subcategory
- `DELETE /v1/categories/:id/subcategories/:subId` — deletes subcategory, entries retain category but lose subcategory reference
- Ownership verified on every mutating request

**Done when:** All seven endpoints respond correctly, business rules are enforced, and ownership checks prevent cross-user access.

---

## Phase 8 — EntriesModule

Log entry CRUD plus the summary analytics endpoint. The most query-intensive phase.
Depends on Phase 7 (categories must exist to attach entries to them).

**Delivers:**
- `GET /v1/entries` — paginated list with filters: type, categoryId, subcategoryId, from/to date
- `POST /v1/entries` — creates entry with ownership check on category and subcategory
- `GET /v1/entries/summary` — aggregated breakdown by category for selected period (7d, 30d, all), includes average productivity score per category
- `GET /v1/entries/:id` — full entry detail
- `PATCH /v1/entries/:id` — updates any field on an entry
- `DELETE /v1/entries/:id` — permanently deletes entry

**Done when:** All six endpoints work, summary aggregation is correct, pagination works on the list endpoint.

---

## Phase 9 — FeatureFlagsModule + AdminModule

Feature flag infrastructure and admin-only endpoints.
Depends on Phase 3 (RolesGuard).

**Delivers:**
- `GET /v1/feature-flags` — returns all flags with enabled state, cached for 60 seconds in memory
- `GET /v1/admin/users` — paginated user list filterable by role and subscription status (ADMIN only)
- `PATCH /v1/admin/feature-flags/:key` — toggles a feature flag (ADMIN only), invalidates cache

**Done when:** Feature flags are served correctly, cache invalidates on toggle, admin endpoints reject non-admin users with 403.

---

## Dependency Map

```
Phase 1 (Monorepo)
    └── Phase 2 (Bootstrap + Schema)
            └── Phase 3 (CommonModule)
                    ├── Phase 4 (AuthModule)
                    │       ├── Phase 5 (EmailModule / SES)
                    │       └── Phase 6 (Users + Onboarding)
                    ├── Phase 7 (CategoriesModule)
                    │       └── Phase 8 (EntriesModule)
                    └── Phase 9 (FeatureFlags + Admin)
```

---

## Post-Implementation Tooling

These tools do not need to be set up during implementation. Add them once all nine phases are complete and before the first real user hits production.

---

### SonarQube Cloud — Static Code Analysis

Analyses every PR for bugs, code smells, security hotspots, and duplication. Posts inline comments on GitHub PRs. Deeper than ESLint — catches logic bugs and vulnerability patterns that lint rules miss.

**Free tier:** Unlimited public repos; private repos up to 50,000 lines of code, up to 5 users.
**How to add:** Create a project on sonarcloud.io, add `sonar-project.properties` to the repo root, add the `SonarSource/sonarcloud-github-action` step to your GitHub Actions workflow.

---

### Snyk — Dependency Vulnerability Scanning

Scans `package.json` and `package-lock.json` for known CVEs using a vulnerability database larger than GitHub's Advisory Database. Runs in CI and blocks merges if a high-severity vulnerability is detected.

**Free tier:** Up to 200 open-source scans per month; unlimited for open-source projects.
**How to add:** Add the `snyk/actions/node` GitHub Actions step after `npm ci`. Run alongside Dependabot — Dependabot handles automated fix PRs, Snyk handles CI gate enforcement.

---

### Trivy — Container Image Scanning

Scans your Docker image for CVEs before it is pushed to AWS ECR and deployed to ECS. Catches vulnerabilities in base images (e.g. a `node:20-alpine` with a known CVE) and in installed OS packages.

**Free tier:** Fully open source (Apache 2.0), no limits.
**How to add:** Add the `aquasecurity/trivy-action` GitHub Actions step in the job that builds your ECS Docker image.

---

### Bruno — API Test Collections

A local-first, Git-native API client. Collections are stored as plain text files in your repo (committed alongside code, reviewed in PRs, run in CI). Replaces Postman/Insomnia for persistent API test suites that travel with the codebase.

**Free tier:** Fully open source (MIT).
**How to add:** Create a `bruno/` folder at the repo root. Build collections as you develop each module. Add `@usebruno/cli` to run them in GitHub Actions as an integration test step.

---

### k6 — Load Testing

Open-source load testing tool with scripts written in JavaScript/TypeScript. Run it before traffic-sensitive features go live (entries list endpoint, summary analytics) to find N+1 query problems and slow aggregations under load.

**Free tier:** Fully open source (AGPL-3.0), unlimited local runs. k6 Cloud (dashboards and distributed load) has 50 virtual user hours/month free.
**How to add:** Write scripts in `load-tests/` and run `k6 run load-tests/entries.js` locally or in a dedicated CI job triggered manually.

---

### PgHero — PostgreSQL Query Dashboard

Self-hosted PostgreSQL dashboard (Docker image) that shows slow queries, missing indexes, cache hit ratio, connection counts, and table bloat. No agent or schema changes required — just point it at your `DATABASE_URL`.

**Free tier:** Fully open source (MIT).
**How to add:** Add a `pghero` service to your `compose.yaml` for local use. For staging/production, run it as a separate ECS task pointing at the RDS instance.

---

### Better Stack — Uptime Monitoring and Status Page

Monitors your health endpoints every 30 seconds from multiple global locations. Sends alerts to Slack/email when the service goes down. Includes a public status page for users.

**Free tier:** 5 monitors, 30-second check intervals, commercial use allowed.
**How to add:** Create monitors for `GET /v1/health/live` and `GET /v1/health/ready` on staging and production. Configure a Slack webhook for alerts.

---

### Doppler — Secret Management

Centralises all environment variables and secrets. Syncs to AWS ECS task definitions and Vercel environment variables automatically. Eliminates `.env` files being passed around and secrets being set manually per environment.

**Free tier:** Free for up to 5 users, unlimited secrets and projects.
**How to add:** Import your existing `.env.example` variables, create separate configs for development, staging, and production, and replace manual environment variable management in ECS and Vercel with Doppler sync.
