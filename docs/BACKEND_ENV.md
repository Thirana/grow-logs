# Environment Variables

This document covers every environment variable used by the Grow Logs backend, its purpose, valid values, and what the value should look like in local development versus production.

The application validates all variables at startup using a Zod schema in `apps/api/src/config/env.validation.ts`. If any required variable is missing or invalid, the server refuses to start and prints the failing field name and reason.

---

## Quick Start (Local Development)

```bash
cp apps/api/.env.example apps/api/.env
```

Then edit `.env` — the only value you must change from the example is `JWT_SECRET`. Everything else works as-is for local development.

---

## Variable Reference

### `PORT`

| | |
|---|---|
| **Required** | No — defaults to `3000` |
| **Type** | Integer, 1–65535 |

The TCP port the NestJS server listens on.

| Environment | Value |
|---|---|
| Local | `3000` |
| Production | Set by the ECS task definition, typically `3000`. The load balancer terminates TLS on port 443 and forwards to this port. |

---

### `NODE_ENV`

| | |
|---|---|
| **Required** | No — defaults to `development` |
| **Allowed values** | `development`, `test`, `production` |

Controls environment-specific behaviour across the application:
- `development` — console-style log output (`pretty` format), email stub logs to console instead of sending via Resend
- `test` — used automatically by Jest; disables Sentry and keeps logging quiet
- `production` — JSON log output, real Resend email sending, Sentry active

| Environment | Value |
|---|---|
| Local | `development` |
| CI | `test` (set by the Jest config) |
| Production | `production` |

---

### `LOG_LEVEL`

| | |
|---|---|
| **Required** | No — defaults to `info` |
| **Allowed values** | `error`, `warn`, `info`, `debug`, `verbose` |

Controls the minimum severity of log messages emitted by Winston. Messages below this level are silently dropped.

| Level | What gets logged |
|---|---|
| `error` | Only unhandled errors and crashes |
| `warn` | Errors plus warnings (e.g. deprecated config) |
| `info` | Errors, warnings, and normal operation events (requests, startup) — **recommended for production** |
| `debug` | Everything above plus internal debug traces |
| `verbose` | All output including low-level framework internals |

| Environment | Recommended value |
|---|---|
| Local | `debug` for active development, `info` otherwise |
| Production | `info` |

---

### `LOG_FORMAT`

| | |
|---|---|
| **Required** | No |
| **Allowed values** | `pretty`, `json` |

Controls the Winston output format.

- `pretty` — human-readable coloured output. Good for reading in a terminal.
- `json` — structured JSON, one object per line. Required for log aggregation tools (Axiom, CloudWatch) because they parse each line as a JSON object.

If this variable is not set, the application derives a default: `pretty` when `NODE_ENV` is not `production`, `json` when it is. You only need to set this explicitly to override that behaviour.

| Environment | Value |
|---|---|
| Local | Leave unset — `pretty` is derived automatically |
| Production | Leave unset — `json` is derived automatically |

---

### `DATABASE_URL`

| | |
|---|---|
| **Required** | Yes |
| **Type** | PostgreSQL connection string |

The full Prisma-compatible connection string for PostgreSQL.

Format: `postgresql://<user>:<password>@<host>:<port>/<database>?schema=public`

| Environment | Value |
|---|---|
| Local | `postgresql://postgres:postgres@localhost:5432/grow-logs?schema=public` — matches the Docker Compose service defined in `compose.yaml` at the repo root |
| Production | Connection string for the AWS RDS PostgreSQL instance. Use the RDS endpoint hostname, the production database user, and a strong generated password. Never reuse the local credentials. |

**Production note:** The production `DATABASE_URL` contains credentials and must be stored in a secret manager (Doppler, AWS Secrets Manager, or ECS Secrets), never in source control or plaintext ECS environment variables.

---

### `FRONTEND_URL`

| | |
|---|---|
| **Required** | No — defaults to `http://localhost:3001` |
| **Type** | URL string |

The origin of the Next.js frontend. Used to:
- Set the CORS `allow-origin` header — requests from any other origin are rejected
- Build absolute URLs in email templates (e.g. the email verification link)

| Environment | Value |
|---|---|
| Local | `http://localhost:3001` |
| Production | Your Vercel deployment URL, e.g. `https://grow-logs.vercel.app` |

Set this to the exact origin (scheme + host + optional port). Do not include a trailing slash.

---

### `JWT_SECRET`

| | |
|---|---|
| **Required** | Yes |
| **Minimum length** | 32 characters |

The secret key used to sign and verify all JWTs — both access tokens and email verification tokens. Any token signed with this secret is trusted by the server, so this value must be kept private.

**Generating a strong secret:**
```bash
# Option 1 — openssl (available on macOS and Linux)
openssl rand -base64 48

# Option 2 — Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

| Environment | Value |
|---|---|
| Local | Any string ≥ 32 characters. The `.env.example` placeholder works but replace it with something unique per developer so local tokens cannot be verified against another developer's server. |
| Production | A cryptographically random string generated with the command above. Rotate this if a breach is suspected — rotation immediately invalidates all active sessions. |

**Never commit this value to source control.** If it is ever accidentally committed, treat it as compromised and rotate immediately.

---

### `JWT_EXPIRES_IN`

| | |
|---|---|
| **Required** | No — defaults to `7d` |
| **Type** | String — a [ms](https://github.com/vercel/ms) duration string |

How long an access token remains valid after it is issued. Accepts values like `1h`, `7d`, `30m`, `900s`.

Access tokens are short-lived by design — once issued they cannot be revoked before expiry, so a shorter lifetime reduces the damage window if a token is stolen. `1h` is the recommended production value. The `7d` default is intentionally longer to reduce friction during local development.

| Environment | Recommended value |
|---|---|
| Local | `7d` (less friction when testing) |
| Production | `1h` |

---

### `BCRYPT_ROUNDS`

| | |
|---|---|
| **Required** | No — defaults to `12` |
| **Type** | Integer, 4–20 |

The bcrypt cost factor used when hashing passwords. Each increment roughly doubles the computation time.

| Rounds | Approx. time per hash | Notes |
|---|---|---|
| 10 | ~65ms | Common default — considered too low for new systems |
| 12 | ~250ms | Recommended minimum for production |
| 14 | ~1000ms | Higher security, noticeable latency on login |

Higher is more secure against brute force, but directly increases login latency. `12` is the right balance for this project.

During automated testing, Jest sets this to a low value (e.g. `4`) via the test environment setup to keep test suites fast without changing the production default.

| Environment | Value |
|---|---|
| Local | `12` (matches production — keeps behaviour identical) |
| Production | `12` |
| Test | `4` (set in Jest config to speed up tests) |

---

### `RESEND_API_KEY`

| | |
|---|---|
| **Required** | Production only — app refuses to start in `production` if missing |
| **Type** | String — Resend API key, always prefixed `re_` |

The API key used to authenticate calls to the Resend email API. Generated in the Resend dashboard under **API Keys**. Use **Sending access** permission (not Full access).

Resend shows the key only once at creation time — copy it immediately and store in `.env` or a secret manager.

| Environment | Value |
|---|---|
| Local | Your real Resend API key — needed only if testing production mode locally. In `development` mode the app logs emails to console and never calls Resend, so the key can be left as a placeholder. |
| Production | The key from your Resend dashboard, stored in a secret manager. Never in source control. |

---

### `RESEND_FROM_ADDRESS`

| | |
|---|---|
| **Required** | Production only — app refuses to start in `production` if missing |
| **Type** | Email address string |

The sender address shown in the `From` field of all outgoing emails. Must be on a domain verified in the Resend dashboard.

**Development / MVP:** Use `onboarding@resend.dev` — Resend's shared sandbox domain, which works without any DNS setup. Restriction: can only send to the email address registered on your Resend account.

**Production:** Use an address on your own verified domain, e.g. `noreply@grow-logs.com`. Requires adding SPF and DKIM DNS records in the Resend dashboard before deploying.

| Environment | Value |
|---|---|
| Local | `onboarding@resend.dev` |
| Production | `noreply@yourdomain.com` (once domain is verified in Resend) |

---

### `APP_URL`

| | |
|---|---|
| **Required** | No — defaults to `http://localhost:3000` |
| **Type** | URL string — no trailing slash |

The base URL of the backend API. Used to construct absolute URLs in email templates (e.g. the email verification link: `${APP_URL}/verify-email?token=...`).

**Do not include a trailing slash** — the verification URL is built by string concatenation.

| Environment | Value |
|---|---|
| Local | `http://localhost:3000` |
| Production | The public URL of your API, e.g. `https://api.grow-logs.com` |

---

### `SENTRY_DSN`

| | |
|---|---|
| **Required** | No |
| **Type** | Sentry DSN URL |

The Data Source Name that tells the Sentry SDK where to send error events. Found in the Sentry project settings under **Client Keys (DSN)**.

Format: `https://<key>@<org>.ingest.sentry.io/<project-id>`

If this variable is empty or not set, Sentry is disabled and no events are sent. This is the correct state for local development — you do not want local errors polluting the production Sentry project.

| Environment | Value |
|---|---|
| Local | Leave empty |
| Production | The DSN from your Sentry project |

---

### `SENTRY_ENABLED`

| | |
|---|---|
| **Required** | No |
| **Allowed values** | `true`, `false`, or empty |

Explicit toggle for Sentry, independent of whether `SENTRY_DSN` is set. Useful to disable Sentry in staging without removing the DSN.

If not set, Sentry activates whenever `SENTRY_DSN` is present. Set to `false` to suppress it explicitly even if the DSN is set.

| Environment | Value |
|---|---|
| Local | Leave empty (DSN is also empty, so Sentry is inactive) |
| Staging | `false` if you want errors to stay out of the production Sentry project |
| Production | Leave empty — if DSN is set, Sentry is active |

---

## Environment Files

| File | Purpose |
|---|---|
| `apps/api/.env.example` | Committed to source control. Contains all variable names with safe placeholder values. No real secrets. |
| `apps/api/.env` | Your local overrides. **Never committed** — listed in `.gitignore`. Copy from `.env.example` and fill in real values. |

Production variables are managed in ECS task definitions or a secret manager, never in files on disk.

---

## Adding a New Variable

1. Add the variable and its Zod validation rule to `apps/api/src/config/env.validation.ts`.
2. Add the variable name and a placeholder value to `apps/api/.env.example`.
3. Add an entry to this document covering purpose, allowed values, and local vs production guidance.
4. Update `apps/api/.env` locally with the real value.
