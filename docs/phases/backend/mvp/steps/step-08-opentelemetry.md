# Step 08 — OpenTelemetry Tracing

**Phase:** Phase 2 — NestJS Bootstrap + Prisma Schema
**Depends on:** Step 04 (NestJS app must be bootstrapped)

> **Status: DEFERRED** — Attempted and partially working. Deferred to revisit after all other steps are complete. See Implementation Notes section below before re-attempting.

---

## What

Instrument the NestJS application with OpenTelemetry to capture distributed traces — a timeline of everything that happens during a single request (NestJS route handling, Prisma queries, outbound HTTP calls). Traces are shipped to Grafana Tempo via the free Grafana Cloud tier.

---

## Why

Logging tells you what happened. Tracing tells you how long each part took and where time was spent. When a request is slow, a trace shows you immediately whether the bottleneck is a database query, an outbound HTTP call, or application logic.

**Why set this up now:** OpenTelemetry instrumentation must be registered before `NestFactory.create()` because it patches Node.js modules (http, Prisma) at startup. Adding it later requires restructuring `main.ts` and risks missing instrumentation on some code paths. It is a one-time setup with no ongoing maintenance.

---

## Deliverables

**Install:**
```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http nestjs-otel
```

**`src/tracing.ts`** — OpenTelemetry SDK initialisation. Must be imported before everything else in `main.ts`.
```ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

**`src/main.ts` update:**
```ts
import './tracing'; // must be before all other imports
import './instrument'; // Sentry second
```

**`OpenTelemetryModule` in `AppModule`:**
Use `nestjs-otel` to expose NestJS-specific metrics (request counts, handler durations) as OpenTelemetry metrics:
```ts
OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true,
    apiMetrics: { enable: true },
  },
})
```

**`apps/api/.env.example` update:**
```dotenv
OTEL_EXPORTER_OTLP_ENDPOINT=https://tempo-prod-xx.grafana.net/otlp/v1/traces
OTEL_SERVICE_NAME=grow-logs-api
```

**`src/config/env.validation.ts` update:**
Add both as optional strings (tracing degrades gracefully when not configured).

---

## Key Decisions

**OpenTelemetry over vendor-specific APM (Datadog, New Relic):** OpenTelemetry is vendor-neutral. You can switch from Grafana to any OTLP-compatible backend (Jaeger, Honeycomb, Datadog) by changing one environment variable. Vendor-specific agents lock you in and often require code changes to migrate away.

**`getNodeAutoInstrumentations()`:** Automatically instruments `http`, `express`, `pg`, and other common modules. You get database query tracing for free without any Prisma-specific code.

**Grafana Cloud Tempo (free tier):** 50 GB traces/month, 14-day retention. More than sufficient for a growing SaaS at MVP stage.

**Tracing disabled locally by default:** When `OTEL_EXPORTER_OTLP_ENDPOINT` is not set, the SDK falls back to a no-op exporter. This means local development is not affected and no errors are thrown if the env var is absent.

---

## Done When

- `npm run start:dev` still boots without errors
- In Grafana Cloud, a request to `GET /v1/health/live` produces a trace showing the NestJS handler and any Prisma queries
- `npm run typecheck` passes
- Application behavior (response bodies, status codes) is unchanged

---

## Implementation Notes (Previous Attempt — Read Before Re-implementing)

A full implementation was attempted and then reverted. Spans were confirmed generating correctly (`traceFlags: 1`) but export to Grafana Cloud was blocked by an auth header issue. Everything below is known-good or known-problem from that attempt.

### What Worked

- **Packages installed:** `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-trace-otlp-http`, `nestjs-otel` all installed cleanly.
- **Span generation confirmed:** OTel was producing spans for every NestJS request, Prisma connect, and HTTP call — visible via `DiagConsoleLogger`.
- **Sentry bridge worked:** `skipOpenTelemetrySetup: true` + `SentryContextManager` + `SentrySpanProcessor` correctly prevented the Sentry/OTel double-init conflict.
- **`OTEL_METRICS_EXPORTER=none` + `OTEL_LOGS_EXPORTER=none`:** Required to stop the NodeSDK auto-configuring OTLP metrics/logs exporters that would 404 against the traces endpoint.
- **`tracesSampleRate: 1.0` in dev:** Required so all spans are recorded (not 20% sampled). Use `process.env['NODE_ENV'] === 'production' ? 0.2 : 1.0`.

### Critical Issues Discovered

**1. Sentry v10 uses OTel internally — they conflict without bridging**

`@sentry/nestjs` v10 initialises its own OTel NodeSDK inside `Sentry.init()`. Running a second `NodeSDK` on top causes context propagation failures and missing traces.

Fix: Add `skipOpenTelemetrySetup: true` to `Sentry.init()` in `instrument.ts`, then wire Sentry's OTel components into the custom NodeSDK setup in `tracing.ts`. Required components (from `@sentry/opentelemetry`, a transitive dep of `@sentry/nestjs`):
- `SentryContextManager` — re-exported directly from `@sentry/nestjs`
- `SentryPropagator` — from `@sentry/opentelemetry`
- `SentrySpanProcessor` — from `@sentry/opentelemetry`
- `SentrySampler` — from `@sentry/opentelemetry`, requires `Sentry.getClient()` as argument

Because `SentrySampler` needs the Sentry client, **`instrument.ts` (Sentry) must run before `tracing.ts`** — opposite of the original step doc order. The correct `main.ts` import order is:
```ts
import './instrument.js'; // Sentry first (skipOpenTelemetrySetup: true)
import './tracing.js';    // OTel second (Sentry client now available)
```

**2. `nestjs-otel` v8 dropped `apiMetrics`**

The step doc shows `apiMetrics: { enable: true }` but `nestjs-otel@8.0.2` (latest) only supports `hostMetrics`. Use:
```ts
OpenTelemetryModule.forRoot({ metrics: { hostMetrics: true } })
```

**3. `OTEL_EXPORTER_OTLP_ENDPOINT` must end with `/v1/traces`**

When you pass an explicit `url` to `OTLPTraceExporter`, the SDK uses it as-is and does NOT append `/v1/traces` automatically. The Grafana Cloud console gives you a base URL like `https://otlp-gateway-prod-us-central-0.grafana.net/otlp` — you must append `/v1/traces` yourself:
```
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp/v1/traces
```

**4. `OTEL_EXPORTER_OTLP_HEADERS` format**

Grafana Cloud provides this env var URL-encoded (e.g. `Authorization=Basic%20token`). The `%20` must be decoded to a real space before storing in `.env`. The correct format:
```
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic MTYzNDI0Nzp...
```
No surrounding quotes, no URL encoding. The value is in `key=value` format where multiple headers are comma-separated.

**5. Auth header not reaching Grafana (unresolved)**

Despite setting `OTEL_EXPORTER_OTLP_HEADERS` in the correct format, Grafana Cloud returned `401: authentication error: no credentials provided`. The parsed headers object was not verified reaching the exporter at send time before the implementation was reverted. This is the one unresolved issue. Before re-implementing, read:
- [Send data to Grafana Cloud OTLP endpoint](https://grafana.com/docs/grafana-cloud/send-data/otlp/send-data-otlp/)
- [OTLPTraceExporter headers option](https://github.com/open-telemetry/opentelemetry-js/tree/main/experimental/packages/exporter-trace-otlp-http)

Verify the exact header format Grafana Cloud expects and whether the JS SDK's `OTLPTraceExporter` `headers` constructor option works as expected in v0.217.x.

**6. `@opentelemetry/sdk-trace-base` version**

Installed version was `2.7.1` (major v2, not 0.x). `BatchSpanProcessor` and `SpanProcessor` type import from `@opentelemetry/sdk-trace-base` — this works fine but the version jump from 0.x to 2.x was unexpected.

### Working `tracing.ts` (minus the auth issue)

```typescript
import * as Sentry from '@sentry/nestjs';
import { SentryContextManager } from '@sentry/nestjs';
import {
  SentryPropagator,
  SentrySampler,
  SentrySpanProcessor,
} from '@sentry/opentelemetry';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import type { SpanProcessor } from '@opentelemetry/sdk-trace-base';

function parseOtelHeaders(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  return Object.fromEntries(
    raw.split(',').flatMap((pair) => {
      const idx = pair.indexOf('=');
      if (idx < 1) return [];
      return [[pair.slice(0, idx).trim(), pair.slice(idx + 1).trim()]] as [string, string][];
    }),
  );
}

const processors: SpanProcessor[] = [new SentrySpanProcessor()];

if (process.env['OTEL_EXPORTER_OTLP_ENDPOINT']) {
  processors.push(
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'],
        headers: parseOtelHeaders(process.env['OTEL_EXPORTER_OTLP_HEADERS']),
      }),
    ),
  );
}

const sentryClient = Sentry.getClient();

const sdk = new NodeSDK({
  serviceName: process.env['OTEL_SERVICE_NAME'] ?? 'grow-logs-api',
  spanProcessors: processors,
  contextManager: new SentryContextManager(),
  textMapPropagator: new SentryPropagator(),
  ...(sentryClient ? { sampler: new SentrySampler(sentryClient) } : {}),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();
```

### Required `.env` vars

```dotenv
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-xx.grafana.net/otlp/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <token>
OTEL_SERVICE_NAME=grow-logs-api
OTEL_METRICS_EXPORTER=none
OTEL_LOGS_EXPORTER=none
```
