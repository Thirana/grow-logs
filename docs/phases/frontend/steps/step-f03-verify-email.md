# Step F03 — Email Verification + Resend

**Phase:** 1  
**Status:** ⬜ Not started  
**Depends on:** F01 (auth layout, `hooks/use-auth.ts`)

---

## Goal

Email verification page that reads the token from the URL and submits it automatically. Resend verification flow for users who did not receive the email or whose token expired.

---

## What to Build

### Page: `app/(auth)/verify-email/page.tsx`

`'use client'` component (needs `useSearchParams`).

**Behaviour:**
1. On mount, read `?token=` from URL search params
2. If token is present: call `useVerifyEmail(token)` — a query that runs once (`enabled: !!token`)
3. Render three states:
   - **Loading:** spinner + "Verifying your email…"
   - **Success:** green checkmark icon + "Email verified!" heading + "Your account is active. You can now log in." + "Go to login" button → `/login`
   - **Error (401/400):** red icon + "Verification failed" heading + message from API or "This link has expired or is invalid." + "Resend verification email" button (triggers the resend flow inline)
4. If no token in URL: show the error state immediately with "No verification token found."

**Resend inline flow (when shown inside verify-email on error):**
- Small form: email input + "Resend" button
- Uses `useResendVerification()` hook
- On success: show "Verification email sent. Check your inbox."
- The API always returns 200 for resend (anti-enumeration) — no error state needed

### Hook additions: `hooks/use-auth.ts`

Add `useVerifyEmail` and `useResendVerification`:

```typescript
export function useVerifyEmail(token: string): UseQueryResult<VerifyEmailResponse, ApiError>
```

- `queryKey: ['auth', 'verify-email', token]`
- `queryFn`: posts to `POST /auth/verify-email` with `{ token }`
- `enabled: !!token`
- `retry: false` — do not retry on failure (expired token won't become valid on retry)
- `staleTime: Infinity` — this is a one-shot operation, never re-fetch

```typescript
export function useResendVerification(): UseMutationResult<ResendResponse, ApiError, { email: string }>
```

Posts to `POST /auth/resend-verification`.

### Component: `components/auth/resend-verification-form.tsx`

Small standalone form used both on the verify-email page (error state) and on the check-email page.

- Single email field
- `resendVerificationSchema` from `packages/schemas` (contains just `{ email }`)
- On submit: calls `useResendVerification()`
- On success: shows confirmation text, hides the form
- Submit button disabled + spinner while in flight

---

## Files Created or Modified

| File | Action |
|---|---|
| `app/(auth)/verify-email/page.tsx` | Create |
| `components/auth/resend-verification-form.tsx` | Create |
| `hooks/use-auth.ts` | Modify — add `useVerifyEmail`, `useResendVerification` |

---

## Done When

- [ ] `/verify-email?token=<valid_token>` auto-submits and shows the success state
- [ ] `/verify-email?token=<expired_token>` shows the error state with a resend option
- [ ] `/verify-email` with no token shows the error state
- [ ] Resend form submits and shows confirmation text on success
- [ ] Loading spinner shown while verification is in progress
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
