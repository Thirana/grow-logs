# Step 07 — Sentry Error Tracking: Setup & Verification Guide

> Temporary file — delete after Step 07 is fully implemented and verified.

---

## What Is Sentry and What Problem Does It Solve?

In production, errors happen silently. A user hits a 500, gives up, and leaves. Without error tracking, you have no idea what went wrong, when it happened, or how often — unless you grep through raw log files and hope the right information was logged.

**Sentry is a real-time error tracking service.** When an unhandled exception occurs in your app, Sentry captures it automatically and sends you:

- Full stack trace with the exact file and line number
- The HTTP request that triggered it (method, URL, headers, body)
- Environment context (Node version, release version, `NODE_ENV`)
- How many users were affected and how often it's occurring
- A timeline of breadcrumbs — what happened in the app leading up to the crash
- Performance traces — how long each database query and function call took

The result: instead of "something broke in production, please investigate", you get "here is the exact error, the exact line, the request that caused it, and it's happened 47 times in the last hour."

### What It Does NOT Replace

- **Structured logging (Winston)** — logs are your audit trail; Sentry is your alarm system. Keep both.
- **Monitoring (uptime/health checks)** — Sentry tracks errors inside a running app; it won't tell you the app is down.
- **Alerting on business metrics** — Sentry is for code errors, not "revenue dropped 30%".

---

## Free Tier Limits (Developer Plan)

| Limit | Value |
|---|---|
| Errors per month | 5,000 |
| Performance spans | 5 million |
| Data retention | 30 days |
| Team members | 1 user |

5,000 errors/month is plenty for development and early production. The step configures `enabled: NODE_ENV === 'production'` so dev/test errors never count against the quota.

---

## How It Works in This Repo

```
Unhandled exception thrown
        │
        ▼
AppExceptionFilter.catch()
        │
        ├─ statusCode >= 500?
        │       │
        │       ▼
        │   Sentry.captureException(exception)   ← reports to Sentry dashboard
        │   + logger.error(...)                  ← structured log to Winston
        │
        └─ statusCode 4xx?
                │
                ▼
            logger.warn(...)    ← log only, do NOT send to Sentry
            (client mistake, not a server bug)

Sentry.init() in instrument.ts
        │
        ├── Captures unhandled Promise rejections
        ├── Captures uncaught exceptions
        ├── Attaches request context to every error
        ├── prismaIntegration() → adds DB query spans to traces
        └── Only enabled when NODE_ENV=production
```

The `instrument.ts` file must be imported as the **first line** of `main.ts` — before NestJS, before any modules — so Sentry can intercept bootstrap errors too.

---

## Before You Start: Things to Set Up Outside the Codebase

### 1. Create a Sentry Account

Go to [https://sentry.io/signup/](https://sentry.io/signup/) and sign up (free). Use your GitHub account for single sign-on.

### 2. Create a New Project

1. In the Sentry dashboard: **Projects → Create Project**
2. Choose platform: **Node.js** (search for "Node.js" — there is no dedicated NestJS option; select Node.js)
3. Set alert frequency: **Alert me on every new issue** (good for early stage)
4. Project name: `grow-logs-api`
5. Click **Create Project**

### 3. Get Your DSN

After creating the project, Sentry shows a DSN that looks like:

```
https://abc123def456@o000000.ingest.sentry.io/0000000
```

This is your **Data Source Name** — the identifier that tells the SDK which Sentry project to send errors to. Copy it.

> The DSN is not a secret — it is safe to commit to non-production config. However, for this repo, keep it only in environment variables (never hardcoded) to follow the env-based config pattern already established.

### 4. Add SENTRY_DSN to Your Local .env

```bash
# apps/api/.env  (already gitignored)
SENTRY_DSN=https://abc123def456@o000000.ingest.sentry.io/0000000
```

Leave the value in `.env.example` empty — that file is committed to the repo.

### 5. Understand the Branch Strategy for This Step

Since this is a contained change affecting only:
- `src/instrument.ts` (new file)
- `src/main.ts` (one import line)
- `src/common/filters/app-exception.filter.ts` (one Sentry call)
- `src/config/env.validation.ts` (one optional field)
- `.env.example` (one empty field)

Create the branch before starting:
```bash
git checkout -b feat/sentry-integration
```

---

## The Implementation (What the Agent Will Do)

The agent will make these specific changes:

### 1. Install packages
```bash
npm install @sentry/nestjs @sentry/profiling-node
```

### 2. Create `src/instrument.ts`
```typescript
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env['SENTRY_DSN'],
  environment: process.env['NODE_ENV'],
  enabled: process.env['NODE_ENV'] === 'production',
  tracesSampleRate: 0.2,       // capture 20% of transactions
  profileSessionSampleRate: 0.1,  // profile 10% of sampled transactions
  integrations: [
    nodeProfilingIntegration(),
    Sentry.prismaIntegration(),
  ],
});
```

### 3. Update `src/main.ts`
```typescript
import './instrument';   // ← MUST be the first line
// ... rest of imports
```

### 4. Update `AppExceptionFilter`
In the `catch()` method, for 5xx errors only:
```typescript
if (statusCode >= 500) {
  Sentry.captureException(exception);   // ← add this
  this.logger.error('Unhandled exception', { ...body, stack });
}
```

### 5. Update `env.validation.ts`
```typescript
SENTRY_DSN: z.string().url().optional(),
```

### 6. Update `.env.example`
```dotenv
SENTRY_DSN=
```

### Key Decision: No `SentryModule` in `AppModule`

The Sentry docs suggest adding `SentryModule.forRoot()` to `AppModule`. This is only required if you want Sentry's automatic request instrumentation to work without any custom filter. Since this repo already has `AppExceptionFilter` which calls `Sentry.captureException()` explicitly, `SentryModule` is not needed. Keeping it out avoids an unnecessary module dependency.

### Key Decision: `nodeProfilingIntegration()` vs `Sentry.prismaIntegration()`

- `nodeProfilingIntegration()` — adds CPU profiling to traces (from `@sentry/profiling-node`)
- `Sentry.prismaIntegration()` — adds Prisma query spans to performance traces (built into `@sentry/nestjs`)

Both are additive and safe to include from day one.

---

## After Implementation: How to Verify It's Working

### Verification 1 — Dev mode does NOT send to Sentry

Start in development mode and trigger an error. Confirm nothing appears in Sentry.

```bash
# apps/api
npm run start:dev
```

This should boot cleanly. `enabled: false` in dev means no errors are sent.

### Verification 2 — Production mode DOES send to Sentry

Run the app in production mode with `NODE_ENV=production` and a valid DSN:

```bash
# From apps/api
NODE_ENV=production SENTRY_DSN=<your-dsn> node dist/src/main
```

Then trigger a deliberate 500 error. The easiest way is to temporarily add a throwing route to the health controller:

```typescript
// Temporary — add to HealthController, remove after testing
@Get('crash-test')
crashTest() {
  throw new Error('Sentry integration test — deliberate crash');
}
```

Hit `GET /v1/health/crash-test` and check the Sentry dashboard. The error should appear within **10–30 seconds**.

Check that the Sentry event contains:
- ✅ Stack trace pointing to your throw line
- ✅ `environment: "production"`
- ✅ HTTP request details (method, URL)

### Verification 3 — 4xx errors do NOT appear in Sentry

Hit an endpoint that returns a 400 or 404:
```bash
curl http://localhost:3000/v1/health/nonexistent
# Should return 404 — should NOT appear in Sentry
```

### Verification 4 — Dev mode produces no noise in Sentry dashboard

After all testing, confirm the Sentry Issues list only contains the deliberate crash test event, not any 4xx errors or dev-mode errors.

### Verification 5 — TypeScript still compiles

```bash
npm run typecheck
```

### Verification 6 — CI pipeline still passes

After pushing the branch, confirm GitHub Actions quality, test, and build jobs all pass green.

---

## Cleanup After Verification

1. Remove the temporary `crashTest()` route from `HealthController`
2. Delete this guide file (`STEP_07_SENTRY_GUIDE.md`)
3. Merge the branch to `main`
4. Update `CONTEXT.md`, `PHASES.md`, and `README.md` per the CLAUDE.md convention

---

## Common Pitfalls

| Pitfall | What Happens | Fix |
|---|---|---|
| `instrument.ts` imported after NestJS imports | Bootstrap errors are not captured | Import it as the absolute first line of `main.ts` |
| `SENTRY_DSN` missing in `.env` but not optional in schema | App refuses to start in dev | Mark it `z.string().optional()` in env validation |
| Sentry enabled in test environment | Test errors pollute dashboard and hit quota | `enabled: NODE_ENV === 'production'` only |
| Capturing 4xx in exception filter | Quota wasted on client mistakes | Only call `captureException` when `statusCode >= 500` |
| Running production build test without `dist/` | `node dist/src/main` fails | Run `npm run build` first |

---

## What You'll See in the Sentry Dashboard After Setup

- **Issues** — each unique error as a grouped issue with occurrence count
- **Performance** — traces showing request duration broken down by DB queries (via `prismaIntegration()`)
- **Alerts** — configured to notify on every new issue

The Sentry project for this app: `grow-logs-api`
