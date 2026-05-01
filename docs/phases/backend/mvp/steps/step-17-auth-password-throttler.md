# Step 17 — AuthModule: Change Password + Rate Limiting

**Phase:** Phase 4 — AuthModule
**Depends on:** Step 15 (login must work to get a JWT for the protected endpoint)

---

## What

Implement the change password endpoint and add rate limiting to all auth endpoints. This completes the `AuthModule`.

---

## Why

**Change password:** A core account security feature. Users need to be able to update their password, and the endpoint must require the current password to prevent anyone who has a valid JWT (e.g. from a stolen session) from locking the real user out.

**Rate limiting:** Auth endpoints are the primary target for automated attacks — credential stuffing, brute force, and account enumeration. Applying rate limiting here specifically prevents these attacks without affecting the rest of the API.

---

## Deliverables

**`packages/schemas/src/auth.ts` update:**
```ts
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[0-9]/, 'must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'must contain a special character'),
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});
```

**`AuthService.changePassword(userId, dto)`:**
1. Find user by ID
2. Compare `dto.currentPassword` with stored hash — throw `UnauthorizedException` if wrong
3. Hash the new password with bcrypt (same cost factor as registration)
4. Update `passwordHash` on the user record

**`PATCH /v1/auth/change-password` controller endpoint:**
- Protected (requires `JwtAuthGuard`)
- Validates body with `ZodValidationPipe(changePasswordSchema)`
- Returns 200

**Rate limiting with `@nestjs/throttler`:**

Install (already in deps from bootstrap):
```bash
# Already installed: @nestjs/throttler
```

Register `ThrottlerModule` in `AppModule`:
```ts
ThrottlerModule.forRoot([{
  name: 'auth',
  ttl: 60_000,   // 1 minute window
  limit: 10,     // 10 requests per minute per IP
}])
```

Apply `@Throttle({ auth: { ttl: 60_000, limit: 5 } })` on the `AuthController` class to tighten the limit specifically for auth endpoints to 5 requests per minute.

Add `ThrottlerGuard` to the global guards in `AppModule` or apply per controller.

---

## Key Decisions

**Verify current password before allowing change:** A valid JWT is proof of authentication, but not necessarily proof of identity at the moment of the action. If a user leaves their session open on a shared computer, anyone could change the password. Requiring the current password adds a second factor.

**Rate limit on controller class, not individual methods:** Applying `@Throttle` at the controller class level covers all auth endpoints (register, login, verify, resend, change-password) with one decorator. Individual methods can override with stricter limits if needed.

**5 requests per minute for auth (not the global 10):** Login attempts should be limited more aggressively than general API usage. 5 login attempts per minute per IP is enough for a real user (they might retry once or twice) but stops automated tools cold.

**429 response uses the standard error envelope:** The `ThrottlerGuard` by default returns a plain string. Override it with a custom `ThrottlerExceptionFilter` (or handle it in `AppExceptionFilter`) to return the standard `{ statusCode, message, errorCode, requestId, path, timestamp }` shape.

---

## Done When

- `PATCH /v1/auth/change-password` with correct current password updates the password and returns 200
- `PATCH /v1/auth/change-password` with wrong current password returns 401
- `PATCH /v1/auth/change-password` with same new password as current returns 400
- After password change, login with the old password returns 401
- After password change, login with the new password returns 200
- Sending 6+ requests to `POST /v1/auth/login` within 1 minute returns 429 on the 6th
- 429 response uses the standard error envelope (not a plain string)
- `npm run test` passes
