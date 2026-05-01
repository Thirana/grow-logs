# Step 07 — Sentry Error Tracking

**Phase:** Phase 2 — NestJS Bootstrap + Prisma Schema
**Depends on:** Step 04 (NestJS app must be bootstrapped)

---

## What

Integrate Sentry into the NestJS application so that every unhandled exception is automatically captured with its full stack trace, request context, and release version. Sentry is the industry-standard error tracking tool — it makes production errors actionable.

---

## Why

Without error tracking, production bugs are invisible until a user reports them. With Sentry, you see every exception the moment it happens, with the exact line of code, the request that caused it, and any relevant user context.

**Why set this up now rather than later:** Sentry must be initialised at the very top of `main.ts` — before `NestFactory.create()` — so it can capture errors that happen during bootstrap itself. Retrofitting it later means reordering bootstrap code, which carries risk. Adding it at this stage is a single file change with no risk.

---

## Deliverables

**Install:**
```bash
npm install @sentry/nestjs @sentry/profiling-node
```

**`src/instrument.ts`** — Sentry initialisation file. Must be imported as the very first line of `main.ts`.
```ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  integrations: [Sentry.prismaIntegration()],
});
```

**`src/main.ts` update:**
```ts
import './instrument'; // must be first
```

**`AppExceptionFilter` update:**
In the catch handler, call `Sentry.captureException(exception)` for all 5xx errors before returning the response. Do not report 4xx errors to Sentry — those are client mistakes, not application bugs.

**`apps/api/.env.example` update:**
```dotenv
SENTRY_DSN=
```
Leave the value empty — it is populated in staging and production only.

**`src/config/env.validation.ts` update:**
Add `SENTRY_DSN` as an optional string (no validation — Sentry is disabled when DSN is absent).

---

## Key Decisions

**`enabled: process.env.NODE_ENV === 'production'`:** Sentry is disabled in development and test environments. This keeps local development clean, prevents test errors from polluting the Sentry dashboard, and avoids hitting the free tier limit with noise.

**Only capture 5xx in the exception filter:** 4xx errors (validation failures, not found, unauthorized) are expected application behaviour — not bugs. Sending them to Sentry creates noise and wastes error quota. Only server errors (5xx) represent unexpected failures worth investigating.

**`tracesSampleRate: 0.2`:** Captures 20% of transactions for performance monitoring. 100% sampling is expensive at scale; 20% gives a statistically representative view without excess cost.

**`prismaIntegration()`:** Sentry's Prisma integration automatically adds database query spans to traces, making it easy to identify slow queries contributing to slow requests.

---

## Done When

- `npm run start:dev` still boots without errors
- In production mode (`NODE_ENV=production`) with a valid `SENTRY_DSN`, a deliberate `throw new Error('test')` in the health controller appears in the Sentry dashboard within seconds
- In development mode, the same error does NOT appear in Sentry
- `npm run typecheck` passes
