# Step F02 — Login + Auth Store Wiring

**Phase:** 1  
**Status:** ⬜ Not started  
**Depends on:** F01 (auth layout exists, `hooks/use-auth.ts` exists)

---

## Goal

Login page that authenticates a user, stores the session in Zustand, and redirects to the correct destination based on `onboardingCompleted`. Update the auth store to match the real API response shape.

---

## What to Build

### Auth Store Update: `stores/auth.store.ts`

The current `AuthUser` interface uses `isVerified`. The real API login response (from `GET /users/me` and login) uses `isEmailVerified` and includes `onboardingCompleted`.

Update `AuthUser`:

```typescript
interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionStatus: 'FREE' | 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
}
```

No other changes to the store's `login`, `logout`, or `setUser` methods.

### Types: `packages/types/src/index.ts`

Add `UserProfile`:

```typescript
export interface UserProfile {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionStatus: 'FREE' | 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
  subscriptionPlan: string | null;
  createdAt: string;
}
```

### Hook: `hooks/use-auth.ts`

Add `useLogin`:

```typescript
export function useLogin(): UseMutationResult<LoginResponse, ApiError, LoginDto>
```

`LoginResponse` shape:
```typescript
{
  data: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      role: 'USER' | 'ADMIN';
      isEmailVerified: boolean;
      onboardingCompleted: boolean;
      subscriptionStatus: string;
    };
  };
  meta: {};
}
```

`useLogin` calls `POST /auth/login`. No `onSuccess` in the hook — the component handles the store update and redirect (it needs to inspect `onboardingCompleted` to decide where to send the user).

Also add `useLogout`:

```typescript
export function useLogout(): UseMutationResult<void, ApiError, void>
```

`useLogout` calls `POST /auth/logout`. On success: `useAuthStore().logout()` then `router.push('/login')`.

### Page: `app/(auth)/login/page.tsx`

Thin server component. Renders `LoginForm`. Title metadata: `Log in`.

### Component: `components/auth/login-form.tsx`

`'use client'` component.

**Fields:**
- Email (`type="email"`)
- Password (`type="password"`)

**Schema:** `loginSchema` from `packages/schemas`.

**Behaviour on submit:**
1. Call `useLogin()`
2. On success:
   - Call `useAuthStore().login(user, accessToken)` with the response data
   - If `user.onboardingCompleted === false` → `router.replace('/onboarding')`
   - If `user.onboardingCompleted === true` → `router.replace('/dashboard')`
3. On 401 with message containing "not verified": redirect to `/check-email?resend=true`
4. On any other 401: show inline error below the form (not under a specific field): "Invalid email or password."
5. On 400: show generic error toast

**Submit button:** disabled and spinner while in flight. Label: "Log in".

**Footer:** "Don't have an account? Sign up" link to `/register`.

---

## Files Created or Modified

| File | Action |
|---|---|
| `app/(auth)/login/page.tsx` | Create |
| `components/auth/login-form.tsx` | Create |
| `hooks/use-auth.ts` | Modify — add `useLogin`, `useLogout` |
| `stores/auth.store.ts` | Modify — update `AuthUser` interface |
| `packages/types/src/index.ts` | Modify — add `UserProfile` |

---

## Done When

- [ ] `/login` renders the auth layout with the login form
- [ ] Submitting with correct credentials stores the user and token in the auth store
- [ ] Verified user with `onboardingCompleted: true` is redirected to `/dashboard`
- [ ] Verified user with `onboardingCompleted: false` is redirected to `/onboarding`
- [ ] Unverified user is redirected to `/check-email?resend=true`
- [ ] Wrong credentials show an inline error: "Invalid email or password."
- [ ] Submit button is disabled and shows a spinner while in flight
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
