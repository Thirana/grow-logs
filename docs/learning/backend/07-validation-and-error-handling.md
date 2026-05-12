# 07 — Validation and Error Handling

**Phase:** Phase 2 | **Concepts:** Input validation, Zod, ValidationPipe, exception filter, consistent error envelope, error codes

---

## Why Validate at System Boundaries?

A **system boundary** is any point where data enters your system from outside — an HTTP request body, a query parameter, an environment variable, a message from a queue. Data from outside your system cannot be trusted.

The rule: **validate at the boundary, trust internally.**

```
Client → [ VALIDATE HERE ] → Controller → Service → Prisma → Database
                                  ↑
                         never trust past this point
```

Once data has passed validation at the boundary, internal code can trust it. You do not re-validate the same data in every function it passes through — that is noise. But nothing from outside the system reaches internal code without being checked.

There are two boundaries in this project: HTTP request bodies (validated by `ValidationPipe`) and environment variables (validated by Zod at startup).

---

## Environment Validation with Zod

Environment variables are the first boundary the application hits — before it even starts listening for requests. If `DATABASE_URL` is missing or malformed, the app should **refuse to start** with a clear error message rather than start and fail mysteriously later.

```typescript
// src/config/env.validation.ts
const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).optional().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).optional().default('info'),
  LOG_FORMAT: z.enum(['pretty', 'json']).optional(),
  DATABASE_URL: z.string().min(1),      // required — no default
  FRONTEND_URL: z.string().optional().default('http://localhost:3001'),
})
.transform((data) => ({
  ...data,
  // derive LOG_FORMAT from NODE_ENV if not explicitly set
  LOG_FORMAT: data.LOG_FORMAT ?? (data.NODE_ENV === 'production' ? 'json' : 'pretty'),
}));

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`Environment validation failed — ${messages}`);
  }
  return result.data;
}
```

This is registered in `AppModule`:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  validate: validateEnv,   // runs at startup — throws if env is invalid
})
```

If `DATABASE_URL` is missing, the app throws on startup and `process.exit(1)` is called in the bootstrap catch block. In a container environment (ECS, Kubernetes), a non-zero exit code causes the container orchestrator to mark the deployment as failed and alert on-call.

### Why Zod instead of class-validator for environment variables?

This project uses Zod as the single validation library — for environment variables, request bodies (via shared `packages/schemas`), and frontend forms. Using class-validator only for environment variables would introduce a second validation library with no benefit. One library, one syntax, everywhere.

---

## Request Body Validation with ValidationPipe

HTTP request bodies are the second boundary. A client can send anything — wrong types, missing fields, extra fields, injection attempts.

`ValidationPipe` sits between the router and the controller handler. It receives the raw request body, validates it, and either passes a clean typed object to the handler or throws a `BadRequestException`.

```typescript
// src/app.setup.ts
new ValidationPipe({
  whitelist: true,             // strip fields not in the DTO
  forbidNonWhitelisted: true,  // throw if unknown fields are sent
  transform: true,             // coerce types (string "3000" → number 3000)
  exceptionFactory: (errors) => {
    return new BadRequestException({
      message: 'Validation failed',
      errors: errors.flatMap((e) => Object.values(e.constraints ?? {})),
      errorCode: 'VALIDATION_ERROR',
    });
  },
})
```

### `whitelist: true` — the security feature

Without whitelist, a client can send extra properties that slip through to service code:

```json
// Client sends to POST /auth/register:
{
  "email": "user@example.com",
  "password": "secret",
  "role": "ADMIN"    ← attacker trying to escalate privileges
}
```

With `whitelist: true`, the `role` field is stripped before the DTO reaches the controller. The handler never sees it. This is defence-in-depth — even if the service code mistakenly used the body object directly in a Prisma `create`, it couldn't set `role` because the field doesn't exist.

`forbidNonWhitelisted: true` goes further: instead of silently stripping, it throws a 400 error. This is stricter and surfaces API misuse immediately.

### The custom `exceptionFactory`

By default, NestJS's `ValidationPipe` returns error messages as an array in the `message` field:

```json
{ "message": ["email must be an email", "password is too short"] }
```

This breaks the API contract — `message` must always be a string (a human-readable summary). The custom `exceptionFactory` enforces the correct shape:

```json
{
  "message": "Validation failed",        // string — always
  "errors": [                            // array — field-level messages
    "email must be an email",
    "password is too short"
  ],
  "errorCode": "VALIDATION_ERROR"
}
```

The client always knows: `message` is a string it can display; `errors` is an array of field-level detail it can use to highlight form fields.

---

## The Exception Filter

`AppExceptionFilter` is the error boundary of the entire application. It catches every exception — validation errors, auth errors, not-found errors, unexpected crashes — and converts them into the standard error envelope.

```typescript
// src/common/filters/app-exception.filter.ts
@Catch()  // catches everything — no type argument
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const statusCode = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    const body = this.buildResponseBody(exception, statusCode, req);

    if (statusCode >= 500) {
      this.logger.error('Unhandled exception', { ...body, stack });
    } else {
      this.logger.warn('Request error', body);
    }

    res.status(statusCode).json(body);
  }
}
```

The filter handles both typed NestJS exceptions (`HttpException` subclasses) and untyped errors (plain `Error`, network errors, Prisma errors). Regardless of what was thrown, the client receives the same JSON shape.

---

## The Standard Error Envelope

Every error response from this API follows this shape:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email", "password is too short"],
  "errorCode": "VALIDATION_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "path": "/v1/auth/register",
  "timestamp": "2026-05-06T10:30:00.000Z"
}
```

| Field | Purpose |
|---|---|
| `statusCode` | HTTP status code — redundant with the response status but useful for parsing |
| `message` | Human-readable summary — always a string |
| `errors` | Array of field-level or detail messages — empty array if not applicable |
| `errorCode` | Machine-readable code — client uses this for conditional logic |
| `requestId` | Trace ID — correlate with server logs |
| `path` | Which endpoint failed |
| `timestamp` | When it happened |

### Why a consistent envelope matters

Without a consistent shape, every client that consumes this API must handle errors differently depending on which endpoint failed. A consistent envelope means:

- The frontend can have **one** error handler for all API errors
- `errorCode` lets the frontend show different UI for different errors without parsing `message` strings
- `requestId` lets support staff look up exactly what happened for a specific user complaint

### Error Codes — `error-code.util.ts`

Error codes are screaming-snake-case strings that describe the category of failure:

```typescript
// src/common/http/error-code.util.ts
export function deriveErrorCode(
  statusCode: number,
  errorName?: string,
  explicitCode?: string,
): string {
  if (explicitCode) return explicitCode;  // use explicit if provided

  const statusMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    503: 'SERVICE_UNAVAILABLE',
  };

  return statusMap[statusCode]
    ?? toScreamingSnakeCase(errorName)   // e.g. InternalServerErrorException → INTERNAL_SERVER_ERROR_EXCEPTION
    ?? 'INTERNAL_ERROR';
}
```

The `errorCode` is what the frontend uses for conditional logic — not `message` (which can change) and not `statusCode` alone (too coarse):

```typescript
// Frontend error handler
if (error.errorCode === 'VALIDATION_ERROR') {
  highlightFormFields(error.errors);
} else if (error.errorCode === 'EMAIL_ALREADY_EXISTS') {
  showDuplicateEmailMessage();
} else if (error.errorCode === 'DATABASE_NOT_READY') {
  showMaintenanceBanner();
}
```

---

## The Fail-Fast Principle

The app applies fail-fast in two places:

**1. Startup — missing environment variables:**
```typescript
// src/main.ts
bootstrap().catch((err: unknown) => {
  console.error('Bootstrap failed', err);
  process.exit(1);   // non-zero exit → container orchestrator marks as failed
});
```

**2. Runtime — bad requests reach the controller:**
The `ValidationPipe` throws immediately on invalid input. The request never reaches the service or database.

Fail-fast is preferable to continuing with bad state. An app that starts without `DATABASE_URL` will crash unpredictably later when the first DB query runs — much harder to debug than a clean startup failure with a clear message.

---

## Interview Summary

**Q: What does it mean to validate at system boundaries?**
Any data entering your system from outside — HTTP request bodies, query params, environment variables — is untrusted and must be validated before it reaches business logic. Data that has passed the boundary check can be trusted throughout internal code without re-validating at every function. This keeps validation logic centralised and internal code clean.

**Q: What is `whitelist: true` on NestJS's ValidationPipe?**
It strips any properties from the incoming request body that are not defined in the DTO class. Without it, clients could send extra fields that might accidentally reach a database create/update call and modify fields they shouldn't. It is a security measure — defence-in-depth against mass assignment attacks.

**Q: Why does the error envelope use a separate `errors` array instead of putting everything in `message`?**
`message` is a human-readable summary — a string that can be displayed directly to a user or logged. `errors` is a structured list of field-level detail that the frontend uses to highlight specific form fields or show granular messages. If you put an array in `message`, any client expecting a string breaks. Keeping them separate maintains a clean contract that both humans and code can consume.

**Q: What is an error code and why is it better than checking the HTTP status code or the message string?**
An error code is a machine-readable string like `VALIDATION_ERROR` or `EMAIL_ALREADY_EXISTS`. HTTP status codes are too coarse — there can be many distinct business errors within a single 400 or 409. Message strings can change when copy is updated, which would break any client logic that string-matches them. Error codes are stable identifiers that the frontend can safely use for conditional UI logic.

**Q: Why call `process.exit(1)` on bootstrap failure?**
A non-zero exit code signals failure to the process supervisor — Docker, ECS, Kubernetes, systemd. The supervisor then marks the deployment as failed, triggers an alert, and does not route traffic to the failed container. An app that starts without required configuration and hangs silently is far harder to detect and debug than one that fails loudly and immediately.
