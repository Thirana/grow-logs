# Step 09 — Axiom Log Shipping

**Phase:** Phase 2 — NestJS Bootstrap + Prisma Schema
**Depends on:** Step 04 (Winston must be configured)

---

## What

Add Axiom as a Winston transport so that every structured log emitted by the NestJS application is shipped to Axiom's cloud storage in real time. Axiom provides search, filtering, and dashboards over your logs. Zero changes to application logging code — only the Winston configuration is updated.

---

## Why

When deployed to AWS ECS, container logs exist only while the container is running. The moment a container restarts (crash, deployment, scale-in), its logs are gone unless they were shipped somewhere. Without a log aggregation service, debugging a production incident means guessing — you have no logs from the container that crashed.

**Why Axiom specifically:** The Winston transport is officially maintained by Axiom. The free tier gives 500 GB ingest per month and 30-day retention — more than sufficient for a growing SaaS. It has zero-infrastructure overhead compared to running your own ELK stack.

---

## Deliverables

**Install:**
```bash
npm install @axiomhq/winston
```

**`src/common/logging/winston.config.ts` update:**

Add Axiom as a second transport when `AXIOM_DATASET` and `AXIOM_TOKEN` are present:
```ts
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';

const transports: winston.transport[] = [new winston.transports.Console({ format: ... })];

if (process.env.AXIOM_DATASET && process.env.AXIOM_TOKEN) {
  transports.push(
    new AxiomTransport({
      dataset: process.env.AXIOM_DATASET,
      token: process.env.AXIOM_TOKEN,
    }),
  );
}
```

**`apps/api/.env.example` update:**
```dotenv
AXIOM_DATASET=
AXIOM_TOKEN=
```

**`src/config/env.validation.ts` update:**
Add both as optional strings. When absent, the console transport runs alone (development behaviour unchanged).

---

## Key Decisions

**Conditional transport (only when env vars are set):** Local development should not require an Axiom account. The transport is only added when both `AXIOM_DATASET` and `AXIOM_TOKEN` are present. This keeps the development experience clean.

**Console transport always runs:** Even in production, the console transport stays active. ECS captures stdout/stderr and ships them to CloudWatch. Axiom is the primary log search tool; CloudWatch is the fallback.

**Structured JSON to Axiom:** The Axiom transport receives the same structured log objects that Winston sends to console in production mode. Axiom indexes every field, so you can filter by `requestId`, `statusCode`, `event`, etc.

**No log level filtering on the transport:** Both transports use the same log level. If you want to ship only `warn` and above to Axiom in production (to reduce ingest), set the transport's `level` option to `warn`.

---

## Done When

- `npm run start:dev` still boots without errors
- With `AXIOM_DATASET` and `AXIOM_TOKEN` set, a request to `GET /v1/health/live` produces a log entry visible in the Axiom dataset dashboard
- Without the env vars set, the app behaves exactly as before
- `npm run typecheck` passes
