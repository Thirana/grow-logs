# Step F01 — Auth Layout + Register + Check Email

**Phase:** 1  
**Status:** ✅ Complete  
**Depends on:** Backend auth endpoints (Steps 14–16 complete)

---

## Goal

Build the shared auth shell layout and the first user-facing auth flow: registration and the post-registration confirmation page.

---

## What to Build

### Route Group: `app/(auth)/`

**`app/(auth)/layout.tsx`**

Two-column layout:
- Left column (hidden on mobile, `lg:flex`): brand panel with logo, product tagline, and a short value proposition bullet list. Dark background (`bg-gl-bg`).
- Right column: the form, centred vertically and horizontally.

On mobile: only the right (form) column is visible — the left panel collapses entirely.

This layout is shared by all auth pages (register, login, verify-email, check-email). No data fetching in this layout.

### Utility: `lib/utils.ts`

Add `getApiErrorMessage(error: unknown): string` — extracts a user-readable message from an Axios error response.

```typescript
// Returns the first message from the API error envelope, or a generic fallback
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
```

This utility is used by every mutation's `onError` handler from this step onward.

### Page: `app/(auth)/register/page.tsx`

Thin server component. Renders `RegisterForm`. Title metadata: `Register`.

### Component: `components/auth/register-form.tsx`

`'use client'` component.

**Fields:**
- Email (`type="email"`, label "Email address")
- Password (`type="password"`, label "Password")
- Confirm password (UI-only, not sent to API; validates `password === confirmPassword`)

**Schema:** Import `registerSchema` from `packages/schemas`. Extend locally with `confirmPassword` field (this field is UI-only so it does not belong in the shared schema).

```typescript
const formSchema = registerSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

**Form library:** `react-hook-form` + `zodResolver`.

**Behaviour on submit:**
- Calls `useRegister()` hook
- On 201: redirect to `/check-email`
- On 409: show inline error under the email field: "An account with this email already exists."
- On 400: show field-level errors if Zod returns them, otherwise generic toast

**Submit button:** disabled and shows a spinner while the mutation is in flight. Label: "Create account".

**Footer:** "Already have an account? Log in" link to `/login`.

### Hook: `hooks/use-auth.ts`

Create the file. Add only the hooks needed for this step:

```typescript
export function useRegister(): UseMutationResult<RegisterResponse, ApiError, RegisterDto>
```

`RegisterResponse` shape: `{ data: { message: string }; meta: {} }`

`useRegister` posts to `POST /auth/register`. No `onSuccess` side effect — the component handles navigation.

### Page: `app/(auth)/check-email/page.tsx`

Static server component. No form.

Content:
- Heading: "Check your inbox"
- Body: "We sent a verification link to your email address. Click the link in the email to activate your account."
- Small note: "Didn't get an email? Check your spam folder or resend the verification email."
- Link: "Resend verification email" → `/verify-email?resend=true` (built in F03)
- Link: "Back to login" → `/login`

No API calls on this page.

### Types: `packages/types/src/index.ts`

Add the first type — the auth registration response is just a message, no new type needed. But add the file skeleton with an empty export so the package is ready for F02:

```typescript
// packages/types/src/index.ts
export {};  // placeholder — types added incrementally per step
```

If the file already exists, skip this.

---

## Files Created or Modified

| File | Action |
|---|---|
| `app/(auth)/layout.tsx` | Create |
| `app/(auth)/register/page.tsx` | Create |
| `app/(auth)/check-email/page.tsx` | Create |
| `components/auth/register-form.tsx` | Create |
| `hooks/use-auth.ts` | Create |
| `lib/utils.ts` | Modify — add `getApiErrorMessage` |
| `packages/types/src/index.ts` | Create or verify |

---

## Done When

- [ ] `/register` renders the two-column auth layout with the register form
- [ ] Form shows inline validation errors before submission
- [ ] Submitting with a new email redirects to `/check-email`
- [ ] `/check-email` shows the confirmation message and links
- [ ] Submitting with a duplicate email shows an inline error under the email field
- [ ] Submit button is disabled and shows a spinner while the request is in flight
- [ ] Auth layout collapses to form-only on mobile
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
