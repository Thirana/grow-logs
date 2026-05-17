# Step F14 — Change Password

**Phase:** 6  
**Status:** ⬜ Not started  
**Depends on:** F13 (settings page exists, `hooks/use-user.ts` created)

---

## Goal

Add the change password form to the settings page's Security section.

---

## What to Build

### Hook: `hooks/use-user.ts`

Add `useChangePassword`:

```typescript
export function useChangePassword(): UseMutationResult<{ message: string }, ApiError, ChangePasswordDto>
```

Calls `PATCH /auth/change-password`. No query invalidation needed — password change does not affect cached data.

### Component: `components/settings/change-password-form.tsx`

`'use client'` component.

**Fields:**
- Current password (`type="password"`)
- New password (`type="password"`)
- Confirm new password (`type="password"`, UI-only — not sent to API)

**Schema:** Import `changePasswordSchema` from `packages/schemas` and extend locally with the confirm field:

```typescript
const formSchema = changePasswordSchema.extend({
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});
```

**Behaviour:**
- On success: show toast "Password changed", reset the form
- On 401 (wrong current password): show inline error under `currentPassword`: "Current password is incorrect."
- On 400: show field errors

### Settings Client Update

`components/settings/settings-client.tsx`:
- Replace the Security placeholder card with the real `ChangePasswordForm`

---

## Files Created or Modified

| File | Action |
|---|---|
| `components/settings/change-password-form.tsx` | Create |
| `components/settings/settings-client.tsx` | Modify — add `ChangePasswordForm` |
| `hooks/use-user.ts` | Modify — add `useChangePassword` |

---

## Done When

- [ ] Security section renders the change password form
- [ ] Entering a wrong current password shows an inline error
- [ ] Mismatched confirm password shows an inline validation error before submission
- [ ] Successful change shows a toast and resets the form
- [ ] Submit button disabled + spinner while in flight
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
