# Step 15 — AuthModule: Login + JWT Issuance

**Phase:** Phase 4 — AuthModule
**Depends on:** Step 14 (register must work, users table must have records), Step 12 (JWT strategy must be configured)

---

## What

Implement user login. The user submits email and password. The system validates credentials, checks email verification status, and returns a signed JWT access token along with the user's profile (including `onboardingCompleted` so the frontend knows where to redirect).

---

## Why

Login is the second half of the authentication entry point. It is implemented after register because login requires a user to exist — testing the full flow in order ensures the sequence works end-to-end.

The `onboardingCompleted` field in the login response is critical for the frontend routing: after login, the frontend redirects to `/onboarding` if `onboardingCompleted` is false, or `/dashboard` if true. This must be present in the login response from day one.

---

## Deliverables

**`packages/schemas/src/auth.ts` update:**
```ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;
```

**`AuthService.login(dto)`:**
1. Find user by email — if not found, do NOT reveal this (see key decisions)
2. Compare password with `bcrypt.compare(password, user.passwordHash)`
3. If password is wrong, throw `UnauthorizedException` with a generic message
4. If `user.isEmailVerified` is false, throw `UnauthorizedException('Email not verified. Please check your inbox.')`
5. Sign JWT: `{ sub: user.id, role: user.role }`, expires in `JWT_EXPIRES_IN`
6. Return access token + user profile

**`POST /v1/auth/login` response:**
```json
{
  "data": {
    "accessToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "isEmailVerified": true,
      "onboardingCompleted": false,
      "subscriptionStatus": "FREE"
    }
  },
  "meta": {}
}
```

**`POST /v1/auth/login` controller endpoint:**
- Public (no JWT guard)
- Validates body with `ZodValidationPipe(loginSchema)`
- Returns 200

---

## Key Decisions

**Generic error for wrong credentials:** The endpoint always returns "Invalid email or password" — never "Email not found" or "Wrong password" separately. This prevents user enumeration: an attacker cannot use the login endpoint to discover which emails have accounts.

**Email verified check after password check:** Check the password first, then check verification status. This ensures the error response is always "Invalid email or password" for wrong credentials, and only reveals the verification status when the password is correct. If you check verification first, an attacker could enumerate verified vs unverified accounts.

**`role` in JWT payload:** Including the user's role in the JWT means the `RolesGuard` can check permissions without a database query on every request. The tradeoff is that a role change does not take effect until the token expires. For MVP (single admin managed manually), this is acceptable.

**No refresh tokens at MVP:** Refresh tokens require a token storage mechanism (Redis or DB table), a refresh endpoint, and token rotation logic. For a 7-day access token, this complexity is not justified at MVP. Add refresh tokens when the business requires shorter access token lifetimes.

---

## Done When

- `POST /v1/auth/login` with valid credentials returns 200 with `accessToken` and user profile
- Login with wrong password returns 401 with a generic message (does not reveal which field is wrong)
- Login with unverified email returns 401 with a message about email verification
- Login with a non-existent email returns 401 with the same generic message (no user enumeration)
- The returned JWT is accepted by `JwtAuthGuard` on a protected test route
- `npm run typecheck` and `npm run test` pass
