# Step 12 — CommonModule: JWT Guard + Passport Strategy

**Phase:** Phase 3 — CommonModule (Shared Infrastructure)
**Depends on:** Step 11

---

## What

Implement the `JwtAuthGuard` and the Passport JWT strategy that validates incoming Bearer tokens on every protected route. This is the authentication backbone — every protected endpoint in the application uses this guard.

---

## Why

The JWT guard is used by every module from Phase 4 onwards. Building it as a standalone step inside `CommonModule` means it can be thoroughly tested before any business logic depends on it. A broken auth guard would silently allow unauthenticated requests through — or block all authenticated ones. Getting it right here prevents cascading failures across all subsequent steps.

---

## Deliverables

**Install:**
```bash
npm install @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt
```

**`apps/api/src/common/guards/jwt-auth.guard.ts`**
```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

**`apps/api/src/common/strategies/jwt.strategy.ts`**

Passport strategy that:
- Extracts the Bearer token from the `Authorization` header
- Verifies the token signature using `JWT_SECRET`
- Returns a `{ userId, role }` payload attached to `req.user`

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  validate(payload: { sub: string; role: UserRole }): AuthenticatedUser {
    return { userId: payload.sub, role: payload.role };
  }
}
```

**`apps/api/src/common/types/authenticated-user.type.ts`**
```ts
export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}
```

**`apps/api/src/config/env.validation.ts` update:**
```
JWT_SECRET — required, minimum 32 characters
JWT_EXPIRES_IN — optional, defaults to '7d'
```

**`apps/api/.env.example` update:**
```dotenv
JWT_SECRET=change-this-to-a-random-secret-at-least-32-chars
JWT_EXPIRES_IN=7d
```

**`CommonModule` update:** Declare `JwtStrategy`, export `JwtAuthGuard`.

**`PassportModule` and `JwtModule`:** Register both in `CommonModule` with `JwtModule.registerAsync(...)` using config service.

---

## Key Decisions

**`sub` claim for user ID:** The JWT `sub` (subject) claim is the standard field for the user's identity. Using `sub` rather than a custom `userId` claim follows the JWT specification.

**`ignoreExpiration: false`:** Tokens must expire. A token that never expires is a permanent credential — if it leaks, the attacker has indefinite access. 7-day expiry is a balance between UX (users don't log in every day) and security.

**`configService.getOrThrow` for `JWT_SECRET`:** If `JWT_SECRET` is not set, the strategy constructor throws immediately at startup. This is correct — a server that cannot verify tokens should refuse to start.

**Minimum 32 characters for `JWT_SECRET`:** HMAC-SHA256 (the default JWT algorithm) requires at least 256 bits of key material. 32 ASCII characters = 256 bits minimum. The Zod validation enforces this.

---

## Done When

- A request with a valid JWT is allowed through the guard
- A request with no token returns 401
- A request with an expired token returns 401
- A request with a tampered token returns 401
- `req.user` contains `{ userId, role }` after the guard passes
- `npm run typecheck` passes
