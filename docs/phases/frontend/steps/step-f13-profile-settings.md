# Step F13 — Profile + Update Email

**Phase:** 6  
**Status:** ⬜ Not started  
**Depends on:** F04 (route protection in place)

---

## Goal

Settings page with the user's profile information and the ability to update their email address.

---

## What to Build

### Route: `app/(dashboard)/settings/page.tsx`

Server component. Title metadata: `Settings`. Renders `SettingsClient`.

### Component: `components/settings/settings-client.tsx`

`'use client'` component. Two sections rendered as cards:
1. **Profile** — current email + update email form
2. **Security** — placeholder card with title "Change password" (form added in F14)

### Hook: `hooks/use-user.ts`

Create the file:

```typescript
export function useProfile(): UseQueryResult<UserProfile, ApiError>
export function useUpdateUser(): UseMutationResult<UserProfile, ApiError, UpdateUserDto>
```

`useProfile`:
- Query key: `['user', 'profile']`
- Calls `GET /users/me`
- `staleTime: 60_000`

`useUpdateUser`:
- `PATCH /users/me`
- On success: invalidate `['user', 'profile']` + update the Zustand store with the new email
  ```typescript
  const { user, setUser } = useAuthStore();
  if (user) setUser({ ...user, email: response.data.data.email });
  ```

### Component: `components/settings/update-email-form.tsx`

`'use client'` component.

**Field:** New email (`type="email"`, pre-filled with `profile.email` from `useProfile()`)

**Schema:** `updateUserSchema` from `packages/schemas` — contains `{ email: z.string().email() }`.

**Behaviour:**
- Submit button disabled when the value equals the current email (no change)
- On success: show toast "Email updated"
- On 409: show inline error "This email is already in use"
- On 400: show field error

**Loading state:** while `useProfile()` is loading, show a skeleton input field.

### Sidebar Link

Add a "Settings" link to the dashboard sidebar:
- Icon: gear/settings icon from `lucide-react`
- Link to `/settings`

---

## Files Created or Modified

| File | Action |
|---|---|
| `app/(dashboard)/settings/page.tsx` | Create |
| `components/settings/settings-client.tsx` | Create |
| `components/settings/update-email-form.tsx` | Create |
| `hooks/use-user.ts` | Create |
| `components/dashboard/sidebar.tsx` | Modify — add Settings link |

---

## Done When

- [ ] `/settings` renders with the user's current email pre-filled in the form
- [ ] Changing the email and submitting calls `PATCH /users/me`
- [ ] Success toast shown on update; email in sidebar/header updates immediately
- [ ] Duplicate email shows an inline field error
- [ ] Submit button disabled when email matches current value
- [ ] Loading skeleton shown while profile is fetching
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
