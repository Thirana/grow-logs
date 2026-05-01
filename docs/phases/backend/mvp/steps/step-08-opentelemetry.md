# Step 08 — OpenTelemetry Tracing

**Phase:** Phase 2 — NestJS Bootstrap + Prisma Schema
**Depends on:** Step 04 (NestJS app must be bootstrapped)

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
