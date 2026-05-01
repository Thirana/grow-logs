# Step 16 — AuthModule: Email Verification + Resend

**Phase:** Phase 4 — AuthModule
**Depends on:** Step 14 (registration and email token generation must exist)

---

## What

Implement the two endpoints that complete the email verification flow: verifying a token submitted by the user, and resending the verification email if the original was missed or expired.

---

## Why

Without these endpoints, registered users are permanently locked out — they can register but never log in. These are the final pieces needed to make the full registration-to-login flow work end-to-end.

---

## Deliverables

**`packages/schemas/src/auth.ts` update:**
```ts
export const verifyEmailSchema = z.object({ token: z.string().min(1) });
export const resendVerificationSchema = z.object({ email: z.string().email() });
```

**`AuthService.verifyEmail(token)`:**
1. Verify the JWT signature and expiry using `JwtService.verify(token)`
2. Check `payload.purpose === 'email-verification'` — reject tokens not issued for this purpose
3. Find user by `payload.sub` (user ID)
4. If already verified, return success silently (idempotent — verifying twice is not an error)
5. Set `isEmailVerified: true` on the user record
6. Return `{ message: 'Email verified successfully. You can now log in.' }`

**`AuthService.resendVerification(email)`:**
1. Always return 200 regardless of outcome — prevents user enumeration (see key decisions)
2. Internally: find user by email, skip if not found or already verified, generate a new token, call `EmailService.sendVerificationEmail`

**Controller endpoints:**
- `POST /v1/auth/verify-email` — public, returns 200
- `POST /v1/auth/resend-verification` — public, returns 200

---

## Key Decisions

**`resendVerification` always returns 200:** If it returned 404 for unknown emails, an attacker could use it to enumerate which email addresses are registered. Always returning 200 with "check your email" prevents this.

**Purpose claim in token:** The verification token JWT has `purpose: 'email-verification'`. This prevents a user from submitting a login JWT (or any other JWT from the system) as a verification token. Always validate that a token was issued for the specific purpose it is being used for.

**Idempotent verification:** If a user clicks the verification link twice (common when email clients pre-fetch links), the second request should succeed silently rather than returning an error. This avoids confusing the user.

**Token invalid vs expired:** Both cases return 401 with a message suggesting the user request a new link. Do not distinguish between "wrong signature" and "expired" — both mean the token is unusable.

---

## Done When

- `POST /v1/auth/verify-email` with a valid token sets `isEmailVerified: true` and returns 200
- `POST /v1/auth/verify-email` with an expired token returns 401
- `POST /v1/auth/verify-email` with a tampered token returns 401
- `POST /v1/auth/verify-email` called twice with the same token succeeds both times
- `POST /v1/auth/resend-verification` always returns 200 regardless of email existence
- After successful verification, `POST /v1/auth/login` with the same credentials returns 200
- `npm run test` passes
