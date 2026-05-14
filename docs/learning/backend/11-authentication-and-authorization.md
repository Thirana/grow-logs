# 11 — Authentication and Authorization

**Phase:** Phase 3–4 | **Concepts:** JWT, Passport.js, guards, custom decorators, ownership verification, bcrypt, registration flow, login flow, security patterns

---

## What Is Authentication vs Authorization

These two words are often confused but they represent distinct checks that happen at different points in the request lifecycle.

**Authentication** answers: *who are you?*
The system verifies the caller's identity — typically by validating a token or credentials. This is what `JwtAuthGuard` does. It either confirms the caller is a known user or rejects the request with a 401.

**Authorization** answers: *are you allowed to do this?*
The system checks whether the authenticated identity has permission to perform the requested action. This happens in two places in this repo:
- `RolesGuard` — checks the user's role (USER vs ADMIN) at the route level
- `assertOwnership` — checks that a resource belongs to the requesting user at the service level

Authentication always happens before authorization. You cannot check permissions for an identity you haven't confirmed yet.

---

## JSON Web Tokens (JWT)

A JWT is a self-contained, signed token that carries claims about the user. It has three parts separated by dots: a header, a payload, and a signature. The header declares the algorithm used to sign it (HMAC-SHA256 by default). The payload is a JSON object containing claims. The signature is a cryptographic hash that proves the payload has not been tampered with.

**Why self-contained matters:** The server does not need to look up the token in a database to validate it. It only needs to verify the signature using the shared secret (`JWT_SECRET`). This makes JWT validation stateless — any server instance can validate any token without coordination.

**The downside of stateless:** Once issued, a JWT cannot be revoked before it expires. If a token is stolen, the attacker can use it until expiry. This is why access tokens in this repo are short-lived (the `JWT_EXPIRES_IN` config controls this).

### Claims used in this repo

| Claim | Where | Meaning |
|---|---|---|
| `sub` | Access token, verification token | The user's ID — `sub` (subject) is the standard JWT field for the entity the token represents |
| `role` | Access token | The user's role — included so `RolesGuard` can check permissions without a DB query |
| `purpose` | Email verification token | Differentiates this token from an access token — prevents a verification token from being used as an access token or vice versa |
| `exp` | All tokens | Expiry timestamp — Passport rejects expired tokens automatically when `ignoreExpiration: false` |

### Why `sub` instead of `userId`

`sub` is the IETF-standard JWT claim for the principal identity. Using it keeps the token spec-compliant and interoperable. The `JwtStrategy.validate()` method maps `sub` → `userId` so the rest of the application always reads a clear field name.

---

## Passport.js and the Strategy Pattern

Passport is a Node.js authentication middleware library. It uses the **strategy pattern** — you register named strategies, and each strategy defines how to extract and validate credentials for a specific authentication method (JWT, OAuth, local username/password, etc.).

When `JwtAuthGuard` receives a request, it delegates to the registered `'jwt'` strategy (`JwtStrategy`). The strategy extracts the Bearer token from the `Authorization` header, verifies the signature and expiry against `JWT_SECRET`, and calls `validate()` with the decoded payload. Whatever `validate()` returns is attached to `req.user`.

**Why NestJS wraps Passport in a guard:** Passport was designed for Express and uses callbacks. `AuthGuard('jwt')` is NestJS's adapter that converts Passport's callback-style result into the NestJS guard interface — either the request proceeds or an exception is thrown.

---

## Guards

Guards implement `CanActivate` and return a boolean. If they return `false` or throw, NestJS stops the request. Guards run after middleware but before interceptors and pipes — they are the authorization checkpoint for the route.

### JwtAuthGuard

Extends Passport's `AuthGuard('jwt')`. The only custom behaviour is in `handleRequest` — it converts Passport's callback result into a clean `UnauthorizedException` so all authentication failures return a consistent 401 regardless of the underlying failure reason (missing token, expired token, invalid signature).

### RolesGuard

Does not extend Passport. It reads `@Roles(...)` metadata attached to the route via the NestJS `Reflector` and compares it against the role in `req.user`. Two important behaviours:

- **Routes without `@Roles` pass through unconditionally.** The guard only activates when the metadata is present. This means you can apply `RolesGuard` globally or module-wide without accidentally blocking non-admin routes.
- **Method-level `@Roles` overrides class-level `@Roles`.** `getAllAndOverride` reads the method first, then falls back to the class. This is the expected override behaviour.

When `RolesGuard` returns `false`, NestJS throws a `ForbiddenException` (403) automatically. The guard itself never throws — it only returns true or false.

### The difference between 401 and 403

| Code | Meaning | Thrown by |
|---|---|---|
| 401 Unauthorized | Identity not confirmed — token missing, expired, or invalid | `JwtAuthGuard` |
| 403 Forbidden | Identity confirmed, but permission denied — wrong role | `RolesGuard` |

These are not interchangeable. A 401 tells the client to re-authenticate. A 403 tells the client that re-authenticating won't help — they simply don't have permission.

---

## Custom Parameter Decorators

`@CurrentUser()` is a NestJS custom parameter decorator. It extracts `req.user` (populated by `JwtAuthGuard`) and injects it directly into a controller method parameter. This is purely ergonomic — it prevents controller methods from having to inject the full `Request` object just to read the user.

The decorator has no logic of its own beyond reading from the request. It is safe to use only on routes that are already protected by `JwtAuthGuard`, because `req.user` will be undefined on unauthenticated routes.

---

## Ownership Verification

`assertOwnership` is a utility function called in service methods before returning a user-owned resource. It compares the resource's `userId` field against the `userId` from the JWT.

**Why 404 and not 403:** Returning 403 confirms to the caller that the resource exists but belongs to someone else. Returning 404 reveals nothing — the resource either doesn't exist or isn't accessible to this user. This is the standard pattern for user-scoped APIs. From the attacker's perspective, guessing resource IDs produces no useful information.

This check happens in the **service layer**, not the guard layer. Guards operate on routes; ownership checks operate on specific rows returned from the database. The correct place to verify ownership is when you have the row in hand.

---

## Registration Flow

Registration introduces three security concerns: duplicate accounts, password storage, and email ownership verification.

### Duplicate accounts

The service checks for an existing user by email before creating. On a duplicate, it throws `ConflictException` (409). This is a deliberate UX tradeoff — the step decision notes acknowledge that strictly you should return 200 regardless (to prevent email enumeration at the registration endpoint), but the product decision is to surface a helpful error.

### Password hashing with bcrypt

Passwords are never stored. Only the bcrypt hash of the password is stored in `passwordHash`. bcrypt is a deliberately slow hashing algorithm designed to make brute-force attacks impractical:

- It uses a **cost factor** (also called work factor or rounds) that controls how slow the hash computation is. This repo uses **cost factor 12**, which takes approximately 250ms per hash on modern hardware.
- Higher cost factor = slower hash = harder to brute force. Cost 10 (common default) is considered too low for new production systems.
- The cost factor is stored inside the hash string itself, so bcrypt can verify a password even if the cost factor is later changed.
- Each hash includes a random **salt** generated internally, so two users with the same password have different hashes.

### Email verification token

Rather than creating a separate database table for verification tokens, a signed JWT is used. The JWT carries `{ sub: userId, purpose: 'email-verification' }` and expires in 24 hours. When the user clicks the link, the server verifies the signature and checks that `purpose === 'email-verification'` — this prevents an access token from being used as a verification token. No database lookup is required to validate it.

---

## Login Flow

Login validates credentials and issues an access token. The ordering of checks is a deliberate security decision.

### Credential validation ordering

```
1. Find user by email
2. Compare password with bcrypt.compare
3. Check isEmailVerified
```

**This order is security-critical.** If email verification were checked before the password, an attacker could submit a correct email with any password — if they get an "email not verified" response instead of "invalid credentials", they know the email has an account. By checking the password first:

- Wrong email → generic "Invalid email or password"
- Wrong password → generic "Invalid email or password"
- Correct password + unverified email → "Email not verified" (password was correct, so revealing verification status is acceptable)

This prevents **user enumeration** — the ability to use the login endpoint to discover which email addresses have registered accounts.

### Generic error message

`"Invalid email or password"` is intentionally vague. It never says which field was wrong. This is standard security practice. Users who forget which email they used need to try their emails; telling them "email not found" is a convenience that trades security.

### JWT issuance

On successful login, the service calls `jwtService.sign({ sub: user.id, role: user.role })` with no explicit `expiresIn`. This uses the expiry configured in `JwtModule.registerAsync` via `JWT_EXPIRES_IN` — the module-level default applies. This is intentionally different from the verification token, which overrides the expiry explicitly to 24h.

The `role` is included in the payload so `RolesGuard` can make permission decisions without querying the database on every request. The tradeoff: a role change does not take effect until the access token expires. For MVP this is acceptable.

---

## Rate Limiting with @nestjs/throttler

### What it is

Rate limiting caps the number of requests a client can make within a time window. Without it, an attacker can hit the login endpoint thousands of times per second to brute force passwords or enumerate users.

### How it works in this repo

`ThrottlerModule` is registered globally in `AppModule` with a named throttler:

```ts
ThrottlerModule.forRoot([{ name: 'auth', ttl: 60_000, limit: 10 }])
```

`ThrottlerGuard` is wired as a global guard via `APP_GUARD`, so every route is covered by default (10 req/min). `AuthController` overrides this with a tighter limit:

```ts
@Throttle({ auth: { ttl: 60_000, limit: 5 } })
@Controller({ path: 'auth', version: '1' })
export class AuthController { ... }
```

This applies to every endpoint in the controller — register, login, verify-email, resend-verification, and change-password all share the 5 req/min limit.

### 429 response envelope

`ThrottlerException` extends `HttpException`. The existing `AppExceptionFilter` catches all `HttpException` instances via `@Catch()` and wraps them in the standard error envelope. No extra filter is needed — the 429 automatically returns `{ statusCode, message, errorCode, ... }`.

---

## Change Password Flow

The `PATCH /v1/auth/change-password` endpoint requires a valid JWT and the user's current password before allowing a new password to be set.

### Why current password is required

A JWT proves the user authenticated at some point in the past, but not that they are present right now. If someone left a session open on a shared computer, requiring the current password prevents that session from being used to lock out the real user. This is standard security practice for sensitive account mutations.

### Implementation

```ts
async changePassword(userId: string, dto: ChangePasswordDto) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new UnauthorizedException();        // deleted mid-session
  if (!await bcrypt.compare(dto.currentPassword, user.passwordHash))
    throw new UnauthorizedException('Current password is incorrect');

  const hash = await bcrypt.hash(dto.newPassword, rounds);
  await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
}
```

The `refine` on the Zod schema rejects identical `currentPassword` and `newPassword` at the validation layer — the service never sees that case:

```ts
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(...).regex(...),
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  { message: 'New password must be different from current password', path: ['newPassword'] },
);
```

---

## Interview Summary

**Q: What is the difference between authentication and authorization?**
Authentication confirms who the caller is — validating the JWT token and attaching the user to the request. Authorization confirms what they are allowed to do — checking their role against route requirements (`RolesGuard`) and confirming they own the resource they are accessing (`assertOwnership`). Authentication happens first; authorization depends on it.

**Q: Why are JWTs stateless and what is the tradeoff?**
The server can verify a JWT using only the secret — no database lookup is needed. This makes validation fast and horizontally scalable. The tradeoff is that tokens cannot be revoked before they expire. If a token is stolen, the attacker has access until expiry. Keeping access tokens short-lived limits the damage window.

**Q: Why does `RolesGuard` return false instead of throwing a ForbiddenException itself?**
Returning `false` lets NestJS handle the 403 response consistently. It also keeps the guard's responsibility clear — it makes an authorization decision, it doesn't handle HTTP responses. This makes the guard easier to test: you just assert `canActivate` returns true or false.

**Q: Why does `assertOwnership` throw 404 instead of 403?**
Returning 403 confirms the resource exists. Returning 404 reveals nothing. An attacker guessing resource IDs should get no signal about whether the resource exists vs whether they're forbidden from accessing it.

**Q: Why is the password check ordered before the email verification check in login?**
If verification were checked first, returning "email not verified" would confirm that the email has an account. By checking the password first, both wrong-email and wrong-password cases return the same generic message, preventing user enumeration.

**Q: Why does bcrypt use a cost factor and why is 12 used here?**
The cost factor controls how many rounds of hashing are performed. Higher cost = slower hash = harder to brute force. Cost factor 12 takes about 250ms, allowing roughly 4 attempts per second — impractical for brute force. Cost factor 10 (a common default) is considered too low for new production systems.

**Q: Why is the `purpose` claim included in the email verification token?**
The verification token is signed with the same secret as the access token. Without the `purpose` claim, an access token would be structurally valid as a verification token. The `purpose: 'email-verification'` claim, checked explicitly on the verify-email endpoint, ensures tokens cannot be used across different flows.

**Q: Why does rate limiting apply at the controller class level rather than per method?**
Applying `@Throttle` to the controller class covers all endpoints in one decorator. Auth endpoints are collectively the primary attack surface — register, login, verify, resend, and change-password all need the same protection. Individual methods can still override with stricter limits if a specific endpoint needs tighter control.

**Q: Why does the 429 response use the standard error envelope without a custom ThrottlerExceptionFilter?**
`ThrottlerException` extends `HttpException`. The global `AppExceptionFilter` is decorated with `@Catch()` (catches everything) and checks `instanceof HttpException` to extract the status and message. Any `HttpException` subclass — including 429 — automatically gets the standard `{ statusCode, message, errorCode, ... }` shape. No extra filter is needed.

**Q: Why does change-password require the current password if the user already has a valid JWT?**
A JWT proves a past authentication event, not presence at this moment. If a user left a session open on a shared machine, requiring the current password prevents that session from being weaponised to lock out the real user. Sensitive account mutations (password, email, MFA) should always require re-confirmation of credentials.
