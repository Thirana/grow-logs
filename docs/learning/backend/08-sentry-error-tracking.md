# 08 — Sentry Error Tracking

**Phase:** Phase 2 | **Concepts:** Error tracking, Sentry SDK, initialisation order, exception capture, environment-gated features

---

## The Problem with No Error Tracking

Without error tracking, production bugs are invisible until a user reports them. By that point:

- You do not know how long the bug has been happening
- You do not know how many users it affected
- You have no stack trace, no request context, no reproduction steps

With Sentry, every unhandled exception is captured the moment it happens — with the exact file, line number, request URL, and full stack trace. You see bugs before users report them.

---

## How Sentry Works

Sentry is an SDK you add to your application. When an exception occurs, the SDK:

1. Captures the exception with its full stack trace
2. Attaches request context (URL, method, headers)
3. Sends the event to Sentry's servers asynchronously
4. Makes it visible in the dashboard within seconds

The key word is **asynchronous**. Sentry batches events and sends them in the background, so it does not slow down your request handling. The tradeoff is that you must explicitly **flush** pending events if you need to guarantee they are sent before a process exits (e.g., in a test endpoint — see below).

---

## Initialisation Order Matters

Sentry must be initialised **before any other module loads**. This is because Sentry instruments Node.js internals (HTTP, async context) at the point it initialises. If another module loads first and makes an HTTP call, Sentry cannot instrument that call.

In NestJS, the entry point is `main.ts`. The fix is to put Sentry initialisation in a separate file (`instrument.ts`) and import it as the very first line:

```typescript
// main.ts
import './instrument.js'; // must be first — before NestFactory, before AppModule
import { NestFactory } from '@nestjs/core';
```

JavaScript `import` statements at the top of a file are evaluated before any code runs. By putting `instrument.ts` first, Sentry initialises before NestJS creates the application.

---

## The dotenv Problem

`instrument.ts` runs before NestJS loads. This means it also runs before `ConfigModule` reads your `.env` file. So `process.env.SENTRY_DSN` is `undefined` when `Sentry.init()` is called.

The fix is to load `.env` inside `instrument.ts` itself using `dotenv`:

```typescript
// instrument.ts
import 'dotenv/config'; // loads .env before anything else
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env['SENTRY_DSN'],
  // ...
});
```

`dotenv/config` only populates env vars that are not already set. In production, env vars are injected directly into the process, so `dotenv` skips them — this is safe in all environments.

---

## Only Capture 5xx Errors

Sentry has a quota — sending every exception wastes it on noise. 4xx errors (validation failures, 404s, 401s) are **expected client behaviour**, not bugs. Only 5xx errors represent unexpected failures worth investigating.

In the custom exception filter, we call `Sentry.captureException()` only inside the `statusCode >= 500` branch:

```typescript
if (statusCode >= 500) {
  Sentry.captureException(exception); // only server errors go to Sentry
  this.logger.error?.('Unhandled exception', { ...body, stack });
} else {
  this.logger.warn?.('Request error', body); // 4xx — logged only, not reported
}
```

The Sentry docs suggest using a `@SentryExceptionCaptured()` decorator on the filter's `catch()` method, which captures all exceptions. We chose not to use that because it would send 4xx errors to Sentry, creating noise and burning quota.

---

## Disabling Sentry in Development

Sentry should be off by default in local development:
- Local errors pollute the production dashboard
- You hit the free tier limit faster with development noise
- Developers want clean local logs, not Sentry overhead

We gate Sentry using two env vars:

```typescript
enabled:
  process.env['NODE_ENV'] === 'production' ||
  process.env['SENTRY_ENABLED'] === 'true',
```

- In production: always on (`NODE_ENV=production`)
- In local dev: off by default, but can be turned on by setting `SENTRY_ENABLED=true` in `.env` when you want to explicitly test Sentry

---

## SentryModule in AppModule

Beyond `instrument.ts`, Sentry also needs `SentryModule.forRoot()` registered as a NestJS module. This sets up Sentry's request context per HTTP request — without it, events are captured but lack request-scoped data (URL, user context, trace ID).

```typescript
@Module({
  imports: [
    SentryModule.forRoot(), // first, before other modules
    ConfigModule.forRoot({ ... }),
    // ...
  ],
})
export class AppModule {}
```

---

## Testing Sentry Locally

To verify Sentry is wired correctly before going to production:

1. Set `SENTRY_ENABLED=true` in `.env`
2. Use a temporary test endpoint that throws and flushes:

```typescript
@Get('test-error')
async testError(): Promise<never> {
  Sentry.captureException(new Error('Sentry test error'));
  await Sentry.flush(3000); // wait up to 3s for the event to be sent
  throw new InternalServerErrorException('Sentry test error');
}
```

`Sentry.flush(3000)` is needed here because the process might not wait for the async event send before returning the response. In normal application code you do not need to call `flush` — the SDK handles it automatically for long-running processes.

---

## Before Going to Production — Cleanup Checklist

- [ ] Remove the `test-error` endpoint from `health.controller.ts`
- [ ] Set `SENTRY_ENABLED=` (empty) in `.env` — Sentry activates on `NODE_ENV=production` alone

---

## Key Files

| File | Role |
|---|---|
| `src/instrument.ts` | Sentry initialisation — must be imported first in `main.ts` |
| `src/main.ts` | `import './instrument.js'` as the very first line |
| `src/app.module.ts` | `SentryModule.forRoot()` for per-request context |
| `src/common/filters/app-exception.filter.ts` | `Sentry.captureException()` for 5xx only |
| `src/config/env.validation.ts` | `SENTRY_DSN` as optional string |
| `.env` / `.env.example` | `SENTRY_DSN` and `SENTRY_ENABLED` |
