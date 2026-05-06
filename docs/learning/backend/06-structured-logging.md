# 06 — Structured Logging

**Phase:** Phase 2 | **Concepts:** Structured vs plain-text logging, Winston, log levels, formats, request ID propagation

---

## The Problem with Plain-Text Logging

The simplest form of logging is `console.log`:

```typescript
console.log(`User ${userId} created entry ${entryId} in 45ms`);
// → "User abc-123 created entry xyz-456 in 45ms"
```

In development this is readable. In production it is nearly useless:

- You **cannot filter** by user ID — it is embedded in a sentence, not a field
- You **cannot aggregate** — counting how many requests took over 100ms requires parsing strings
- You **cannot alert** — your monitoring tool cannot extract `durationMs` from a sentence
- You **cannot correlate** — there is no standard field to join logs from the same request

### Structured Logging

Structured logging emits logs as **data objects** rather than formatted strings:

```typescript
logger.log('Entry created', {
  event: 'entry.created',
  userId: 'abc-123',
  entryId: 'xyz-456',
  durationMs: 45,
});
// → { "level": "info", "message": "Entry created", "event": "entry.created",
//     "userId": "abc-123", "entryId": "xyz-456", "durationMs": 45,
//     "timestamp": "2026-05-06T10:30:00.000Z", "service": "grow-logs" }
```

Now every field is queryable. Your log aggregation tool (Axiom, Grafana, Datadog) can:
- Filter `userId = 'abc-123'` to see all logs for one user
- Alert when `durationMs > 500`
- Group by `event` to count occurrences
- Join all logs in a request by `requestId`

---

## Winston

Winston is the most widely used logging library for Node.js. It provides:

- **Log levels** — severity hierarchy for filtering
- **Formats** — how a log entry is serialised (JSON, pretty print, etc.)
- **Transports** — where logs go (console, file, external service)
- **Default metadata** — fields added to every log entry automatically

In NestJS, Winston is wired in via `nest-winston`, which bridges Winston to NestJS's `LoggerService` interface. This means you inject `WINSTON_MODULE_NEST_PROVIDER` and call `logger.log()`, `logger.error()`, etc. — the same interface NestJS itself uses, powered by Winston underneath.

---

## Log Levels

Log levels are a hierarchy. Setting a level means "log this level and everything more severe":

```
error   ← most severe — unexpected failures, exceptions
warn    ← expected problems — 4xx errors, degraded state
info    ← normal operations — request completed, server started
debug   ← detailed tracing — useful during development
verbose ← very detailed — database queries, cache hits
```

In production, running at `info` level means `debug` and `verbose` logs are suppressed — they add noise and cost money in log storage. In development, running at `debug` gives more detail for diagnosing issues.

Configured via the `LOG_LEVEL` environment variable, defaulting to `info`.

---

## Log Formats

This project uses one Winston pipeline in all environments. Only the **renderer** (format) changes.

### JSON Format (production)

```json
{
  "level": "info",
  "message": "http.request",
  "service": "grow-logs",
  "event": "http.request",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/v1/health/live",
  "statusCode": 200,
  "durationMs": 12,
  "timestamp": "2026-05-06T10:30:00.000Z"
}
```

JSON is the format log aggregation tools consume. Each field is a key you can filter, aggregate, and alert on.

### Pretty Format (development)

```
10:30:00 [info] Application running on http://localhost:3000
10:30:01 [info] http.request http.request 550e8400 GET /v1/health/live 200 12ms
```

Compact and human-readable. The same structured data, rendered as a single line for terminal readability.

### How It's Configured

```typescript
// src/common/logging/winston.config.ts
function buildWinstonConfig(level: string, format: 'pretty' | 'json', serviceName: string) {
  const jsonFormat = combine(
    timestamp(),
    errors({ stack: true }),   // include stack trace field for Error objects
    json(),
  );

  const prettyFormat = combine(
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp, level, message, stack, ...meta }) => {
      // pull structured fields into a compact line
      const fields = [meta.event, meta.requestId, meta.method, ...].join(' ');
      const base = `${timestamp} [${level}] ${message}${fields ? ' ' + fields : ''}`;
      return stack ? `${base}\n${stack}` : base;
    }),
    colorize({ all: true }),   // colour by log level in terminal
  );

  return {
    level,
    defaultMeta: { service: serviceName },   // added to every log entry
    format: format === 'json' ? jsonFormat : prettyFormat,
    transports: [new transports.Console()],  // console only — ship to Axiom later
  };
}
```

`defaultMeta: { service: 'grow-logs' }` means every single log entry automatically includes `"service": "grow-logs"`. In a system with multiple services (API, worker, scheduler), this field is how you filter logs to one specific service.

### Format Selection

```typescript
// src/config/env.validation.ts
LOG_FORMAT: z.enum(['pretty', 'json']).optional(),

.transform((data) => ({
  ...data,
  LOG_FORMAT: data.LOG_FORMAT ??
    (data.NODE_ENV === 'production' ? 'json' : 'pretty'),
}))
```

- In `production`: defaults to `json`
- In `development`/`test`: defaults to `pretty`
- Always overridable via `LOG_FORMAT=json npm run start:dev`

---

## Request ID Propagation

In a production system, a single user action can generate dozens of log entries — one for the HTTP request, one from the service, one from each database query, one from the exception filter if something goes wrong. Without a shared identifier, these logs are impossible to correlate.

**Request ID** solves this. A unique ID is generated (or preserved from the client) at the start of every request and attached to every log entry from that request.

### How it flows through the app

```
1. Request arrives
   ↓
2. requestIdMiddleware
   - reads x-request-id header (or generates UUID)
   - attaches to req.requestId
   - echoes back in response x-request-id header
   ↓
3. RequestLoggingInterceptor
   - reads req.requestId
   - includes in every log call: { requestId: req.requestId, ... }
   ↓
4. AppExceptionFilter (if error thrown)
   - reads req.requestId
   - includes in error response body AND error log
   ↓
5. Response sent
   - x-request-id header echoed back to client
```

### What it looks like in logs

```json
{ "level": "info",  "requestId": "abc-123", "event": "http.request", "path": "/v1/entries" }
{ "level": "debug", "requestId": "abc-123", "event": "db.query", "table": "entries" }
{ "level": "error", "requestId": "abc-123", "event": "http.request", "statusCode": 500 }
```

Filter by `requestId = "abc-123"` in your log tool and you see the entire lifecycle of one request — which query ran, how long it took, what went wrong.

### Distributed tracing

The client can send its own `x-request-id`. This is used in distributed systems: the frontend generates a trace ID when the user clicks a button, and every backend service that handles that action uses the same trace ID in its logs. You can trace a user action across an entire system.

---

## What This Repo Logs and Where

```typescript
// RequestLoggingInterceptor — every completed request
logger.log({
  event: 'http.request',
  requestId: req.requestId,
  method: req.method,
  path: req.path,
  statusCode: response.statusCode,
  durationMs: Date.now() - startTime,
});

// AppExceptionFilter — every exception
// 5xx errors:
logger.error('Unhandled exception', { ...errorBody, stack });
// 4xx errors:
logger.warn('Request error', errorBody);
```

Application code never uses `console.log`. Every log call goes through the injected Winston logger so the format, level filtering, and transport apply consistently.

---

## Interview Summary

**Q: What is structured logging and why does it matter in production?**
Structured logging emits log entries as data objects (typically JSON) rather than formatted strings. Each piece of information is a named field rather than embedded in a sentence. This makes logs queryable and aggregatable — you can filter by user ID, alert on response time, count errors by type. In production, logs flow into tools like Grafana or Datadog that need consistent field names to build dashboards and alerts. Formatted strings make this impossible.

**Q: What is a request ID and why do you propagate it?**
A UUID generated at the start of every request. It is included in every log entry from that request and returned to the client in the `x-request-id` response header. When something goes wrong, you look up the request ID and can see every log entry from that exact request — which database queries ran, how long they took, what error occurred. Without it, you have isolated log entries with no way to connect them to a specific user action.

**Q: Why use different log formats in development vs production?**
In production, logs are consumed by machines — log aggregation tools need JSON to query and alert on individual fields. In development, logs are consumed by humans — a compact coloured terminal line is faster to read than dense JSON. Using the same underlying structured data in both means the information is identical; only the rendering changes. This repo controls it with `LOG_FORMAT=pretty|json` and derives a sensible default from `NODE_ENV`.

**Q: Why log at `warn` for 4xx errors and `error` for 5xx?**
4xx errors are client errors — the client sent a bad request, wasn't authenticated, or tried to access a resource they don't own. These are expected and normal. 5xx errors are server errors — something the server did wrong, unexpected, that the development team needs to investigate. Alerting on every 4xx would produce enormous noise. Alerting on every 5xx is meaningful signal.
