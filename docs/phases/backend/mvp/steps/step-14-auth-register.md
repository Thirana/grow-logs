# Step 14 — AuthModule: Register + Email Verification Token

**Phase:** Phase 4 — AuthModule
**Depends on:** Step 13 (CommonModule complete), Step 05 (users table exists)

---

## What

Implement user registration. A new user submits email and password. The system validates the input, hashes the password, creates the user record, generates an email verification token, and triggers the email send (via the dev-mode stub — no real emails yet). The user cannot log in until they verify their email.

---

## Why

Registration is the entry point of the entire application — every other feature assumes the user exists and is verified. Implementing it first, before login, means the auth flow is tested in the correct order and the email verification constraint is enforced from the start.

**Email verification is non-negotiable at MVP:** It prevents throwaway accounts, confirms the user owns the address, and is required for transactional email (AWS SES requires verified senders and, in sandbox mode, verified recipients).

---

## Deliverables

**Install:**
```bash
npm install bcrypt @nestjs/jwt
npm install -D @types/bcrypt
```

**`packages/schemas/src/auth.ts`** — registration schema:
```ts
export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[0-9]/, 'must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'must contain a special character'),
});
export type RegisterDto = z.infer<typeof registerSchema>;
```

**`apps/api/src/modules/auth/`** directory with:
- `auth.module.ts`
- `auth.controller.ts`
- `auth.service.ts`

**`AuthService.register(dto)`:**
1. Check if email is already registered — throw `ConflictException` (409) if so
2. Hash password with `bcrypt.hash(password, 12)` — cost factor 12 is the production standard (slow enough to resist brute force, fast enough for UX)
3. Create user record with `isEmailVerified: false`, `onboardingCompleted: false`
4. Generate a signed JWT as the verification token (payload: `{ sub: user.id, purpose: 'email-verification' }`, expires in 24 hours)
5. Call `EmailService.sendVerificationEmail(email, token)` — currently logs to console in dev
6. Return `{ message: 'Registration successful. Please check your email to verify your account.' }`

**`POST /v1/auth/register` controller endpoint:**
- Public (no JWT guard)
- Validates body with `ZodValidationPipe(registerSchema)`
- Returns 201

**Minimal `EmailModule` + `EmailService` stub:**
```ts
sendVerificationEmail(email: string, token: string): void {
  this.logger.log(`[DEV] Verify email: /v1/auth/verify-email?token=${token} (${email})`);
}
```

**`apps/api/.env.example` update:**
```dotenv
BCRYPT_ROUNDS=12
```

---

## Key Decisions

**JWT as verification token (not a random string stored in DB):** A signed JWT as the verification token avoids adding a `email_verification_tokens` table to the schema. The token carries the user ID and expiry inside it. The backend verifies the signature and expiry when the token is submitted — no database lookup required. Simpler schema, equivalent security.

**bcrypt cost factor 12:** At cost factor 12, bcrypt takes ~250ms per hash on modern hardware. This is slow enough to make brute-force attacks impractical (4 attempts/second) but fast enough that registration doesn't feel broken. Cost factor 10 (the common default) is considered too low for new production systems.

**Generic 409 message:** "Email already registered" tells an attacker which emails have accounts. Strictly, you should return 200 with "check your email" regardless. However, this creates a confusing UX for users who genuinely forgot they registered. The product decision is to show a helpful error — this is documented as a UX tradeoff.

---

## Done When

- `POST /v1/auth/register` with valid data returns 201 and a success message
- User record is created in the database with `isEmailVerified: false`
- Password is stored as a bcrypt hash, never plain text
- `POST /v1/auth/register` with a duplicate email returns 409
- `POST /v1/auth/register` with invalid password (no number, too short) returns 400 with `errors[]`
- The dev console logs the verification URL
- `npm run typecheck` and `npm run test` pass
