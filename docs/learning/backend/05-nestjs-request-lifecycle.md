# 05 — NestJS Request Lifecycle

**Phase:** Phase 2 | **Concepts:** NestJS architecture, middleware, guards, pipes, interceptors, exception filters, request lifecycle

---

## NestJS Building Blocks

NestJS structures an application as a layered pipeline. Every HTTP request passes through multiple layers before reaching your controller, and the response passes back through them on the way out. Understanding this pipeline is fundamental to understanding how a NestJS application works.

| Layer | Responsibility | Runs |
|---|---|---|
| **Middleware** | Raw Express/Fastify middleware (CORS, Helmet, request ID) | Before everything else |
| **Guards** | Authorization — should this request be allowed to proceed? | After middleware |
| **Interceptors (pre)** | Transform or log the request before the handler | After guards |
| **Pipes** | Validate and transform the request body/params | After interceptors |
| **Controller** | Route the request to the correct handler method | After pipes |
| **Service** | Business logic, database queries | Called by controller |
| **Interceptors (post)** | Transform the response after the handler | After controller returns |
| **Exception Filter** | Catch any error thrown anywhere and return a consistent error response | On any thrown exception |

---

## The Full Request Lifecycle (This Repo)

```
HTTP Request arrives
        │
        ▼
┌───────────────────────────────────────┐
│           MIDDLEWARE LAYER            │
│                                       │
│  1. Helmet          — sets security   │
│                       headers         │
│  2. CORS            — handles         │
│                       preflight       │
│  3. Request ID      — reads or        │
│     Middleware        generates       │
│                       x-request-id    │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│             GUARDS LAYER              │
│                                       │
│  4. JwtAuthGuard   — validates JWT    │
│     (Phase 3+)       token, attaches  │
│                       user to request │
│  5. RolesGuard     — checks user role │
│     (Phase 3+)       for admin routes │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│          INTERCEPTORS (pre)           │
│                                       │
│  6. RequestLogging — records start    │
│     Interceptor      time             │
│  7. ResponseTransform — wrapper ready │
│     Interceptor       (post-handler)  │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│             PIPES LAYER               │
│                                       │
│  8. ValidationPipe — validates body   │
│                       against DTO     │
│                       rules           │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│          CONTROLLER + SERVICE         │
│                                       │
│  9. Controller  — routes to handler   │
│ 10. Service     — business logic      │
│ 11. Prisma      — database query      │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│         INTERCEPTORS (post)           │
│                                       │
│ 12. ResponseTransform — wraps result  │
│     Interceptor    in { data, meta }  │
│ 13. RequestLogging — logs method,     │
│     Interceptor    path, status,      │
│                    duration           │
└───────────────────┬───────────────────┘
                    │
                    ▼
             HTTP Response

        ── if any layer throws ──
                    │
                    ▼
┌───────────────────────────────────────┐
│         EXCEPTION FILTER              │
│                                       │
│ 14. AppExceptionFilter — catches all  │
│                          errors,      │
│                          returns      │
│                          standard     │
│                          error shape  │
└───────────────────────────────────────┘
```

---

## The `configureApp` Function

All global layers are registered in `src/app.setup.ts`. The order is mandatory:

```typescript
// src/app.setup.ts
export function configureApp(app: INestApplication): void {
  // 1. Switch to Winston logger — must be first so all subsequent logs use it
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 2. URI versioning — must be before any routing setup
  app.enableVersioning({ type: VersioningType.URI });

  // 3. Helmet — sets security headers on the raw response object
  //    Before any app logic so headers are set even if middleware fails
  app.use(helmet());

  // 4. CORS — before request ID so preflight responses include correct headers
  const cfg = app.get(appConfig.KEY);
  app.enableCors({ origin: cfg.frontendUrl, credentials: true });

  // 5. Request ID middleware — attaches requestId to req object
  //    Must be before interceptors/filters that need to read it
  app.use(requestIdMiddleware);

  // 6. ValidationPipe — validates and sanitises incoming request bodies
  app.useGlobalPipes(new ValidationPipe({ ... }));

  // 7. Interceptors — registered after pipes, run in registration order
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(...),
    new ResponseTransformInterceptor(),
  );

  // 8. Exception filter — catches anything thrown by any layer above
  app.useGlobalFilters(new AppExceptionFilter(...));

  // 9. Graceful shutdown — listens for SIGTERM
  app.enableShutdownHooks();
}
```

### Why order matters

**Helmet before request ID middleware:**
Helmet sets response headers using the raw Express response object. If it ran after the request ID middleware, a failure in the request ID step could mean security headers are never set. Placing Helmet first guarantees headers are set regardless.

**CORS before request ID:**
Browser preflight requests (`OPTIONS`) must receive CORS headers before any app logic runs. If CORS was registered after request ID middleware and the request ID step threw, the browser's preflight would fail with no CORS headers.

**Request ID before interceptors/filters:**
The request logging interceptor and exception filter both read `req.requestId` to include in logs and error responses. The request ID must be attached to the request object before these layers run.

**ValidationPipe before interceptors:**
Pipes run just before the controller handler. Interceptors wrap around the entire handler call (pre and post). If validation fails, the interceptors' post-handler code never runs — the exception filter catches the validation error instead.

---

## Each Layer in Detail

### Middleware — `src/common/middlewares/request-id.middleware.ts`

Plain Express middleware. NestJS middleware runs before the NestJS DI system is involved, so it has no access to providers or services — just the raw `req`, `res`, and `next`.

```typescript
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existing = req.headers['x-request-id'];
  const requestId =
    typeof existing === 'string' && existing.length > 0
      ? existing
      : crypto.randomUUID();

  (req as RequestWithId).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
```

Key behaviours:
- **Preserve** an incoming `x-request-id` if the client sends one (useful for distributed tracing — a frontend can generate a request ID and trace it end-to-end)
- **Generate** one via `crypto.randomUUID()` if the client doesn't send one
- **Echo** it back in the response header so the client can correlate

### Guards (Phase 3+)

Guards implement `CanActivate` and return a boolean or throw. If a guard returns `false` or throws, NestJS returns 403. Guards have access to the NestJS DI system so they can inject services.

```typescript
// Pattern — added in Phase 3
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### Interceptors — Pre and Post Handler

Interceptors wrap around the controller handler using RxJS `Observable`. The same interceptor class runs twice — once before the handler (setup) and once after (transform/log).

```typescript
// src/common/interceptors/request-logging.interceptor.ts
intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
  const startTime = Date.now();
  const req = context.switchToHttp().getRequest<RequestWithId>();

  return next.handle().pipe(            // ← next.handle() calls the controller
    tap(() => {                         // ← runs AFTER the controller returns
      const res = context.switchToHttp().getResponse<Response>();
      this.log(req, res.statusCode, Date.now() - startTime);
    }),
    catchError((err: unknown) => {      // ← runs if controller throws
      this.log(req, err instanceof HttpException ? err.getStatus() : 500,
        Date.now() - startTime);
      return throwError(() => err);     // re-throw so exception filter catches it
    }),
  );
}
```

### Pipes — `ValidationPipe`

Pipes receive the raw request data, validate it, and return a transformed value (or throw). The custom `exceptionFactory` shapes the error response:

```typescript
new ValidationPipe({
  whitelist: true,             // strip properties not in the DTO
  forbidNonWhitelisted: true,  // throw if unknown properties are sent
  transform: true,             // convert strings to numbers, etc.
  exceptionFactory: (errors) => {
    return new BadRequestException({
      message: 'Validation failed',      // always a string
      errors: errors.flatMap((e) =>      // array of field error strings
        Object.values(e.constraints ?? {})),
      errorCode: 'VALIDATION_ERROR',
    });
  },
})
```

`whitelist: true` is a security feature — it prevents clients from injecting unexpected properties that might be passed to a database query.

### Exception Filter — `src/common/filters/app-exception.filter.ts`

The filter is the error boundary of the entire application. It catches everything — validation errors, auth errors, business logic errors, and unexpected crashes — and returns a consistent JSON shape:

```typescript
@Catch()  // no arguments = catch everything
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const statusCode = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    // 5xx = unexpected — log full stack
    // 4xx = expected client error — log at warn without stack
    if (statusCode >= 500) {
      this.logger.error('Unhandled exception', { ...body, stack });
    } else {
      this.logger.warn('Request error', body);
    }

    res.status(statusCode).json({
      statusCode,
      message,        // always a string
      errors,         // string[]
      errorCode,      // e.g. 'VALIDATION_ERROR', 'NOT_FOUND'
      requestId,      // from req.requestId
      path,           // req.url
      timestamp,      // ISO8601
    });
  }
}
```

### Response Transform Interceptor

Wraps every successful response in the standard envelope:

```typescript
// Controller returns:  { status: 'ok', uptime: 123 }
// Client receives:     { data: { status: 'ok', uptime: 123 }, meta: {} }
```

Double-wrapping is prevented by checking if the response already has a `data` key:

```typescript
map((data: unknown) => {
  if (data !== null && typeof data === 'object' && 'data' in data) {
    return data;  // already wrapped — pass through
  }
  return { data: data ?? null, meta: {} };
})
```

---

## Interview Summary

**Q: Walk me through what happens when an HTTP request hits a NestJS application.**
The request goes through middleware first (Helmet sets security headers, CORS handles preflight, request ID middleware attaches a trace ID). Then guards check authorization. Then interceptors run pre-handler logic (recording start time). Then pipes validate the request body. Then the controller routes to the handler, which calls the service, which queries the database. The response flows back through the interceptors post-handler (transform shape, log duration). If anything throws at any point, the exception filter catches it and returns a standardised error response.

**Q: What is the difference between middleware and an interceptor in NestJS?**
Middleware is raw Express/Fastify middleware — it has access to `req`, `res`, and `next` but no NestJS context or DI. It runs before NestJS processes the request. Interceptors are NestJS-native and use RxJS Observables — they wrap around the handler and run both before and after it, with full access to the execution context and the ability to transform the response.

**Q: Why does the order of `configureApp` steps matter?**
Because each layer depends on the previous one being set up. Request ID middleware must run before interceptors and filters because they read `req.requestId`. Helmet must run before anything else so security headers are set even if later steps fail. CORS must run before request ID so preflight responses work. If you register these in the wrong order, you get subtle bugs — logs without request IDs, or CORS failures on preflight requests.

**Q: What does `whitelist: true` do on the ValidationPipe?**
It strips any property from the request body that is not declared in the DTO class. Without it, a client could send extra properties that get passed to a database query, potentially overwriting fields they shouldn't control (e.g. sending `role: 'ADMIN'` on a register endpoint). It's a defence-in-depth measure.
