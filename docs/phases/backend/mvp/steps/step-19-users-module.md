# Step 19 — UsersModule

**Phase:** Phase 6 — UsersModule + OnboardingModule
**Depends on:** Step 17 (AuthModule complete — users table has records, JwtAuthGuard works)

---

## What

Implement the two user profile endpoints: reading the authenticated user's profile and updating their email address.

---

## Why

These endpoints are used by the frontend settings page and are also the foundation for future profile features. They are straightforward CRUD operations on the `users` table, but the email update has one business rule that needs explicit handling: the new email must not already be in use by another account.

---

## Deliverables

**`packages/schemas/src/users.ts`:**
```ts
export const updateUserSchema = z.object({
  email: z.string().email(),
});
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
```

**`UsersModule`** with `UsersController` and `UsersService`.

**`UsersService.findById(userId)`:** Fetches user by ID, throws `NotFoundException` if not found.

**`UsersService.updateEmail(userId, newEmail)`:**
1. Check if `newEmail` is already taken by a different user — throw `ConflictException` (409) if so
2. Update the email on the user record
3. Return the updated user

**Controller endpoints:**

`GET /v1/users/me` — protected:
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "isEmailVerified": true,
    "onboardingCompleted": false,
    "subscriptionStatus": "FREE",
    "subscriptionPlan": null,
    "createdAt": "ISO8601"
  },
  "meta": {}
}
```

`PATCH /v1/users/me` — protected, returns 200 with updated profile.

**Response shape:** Never include `passwordHash`, `stripeCustomerId` in any response from this module.

---

## Key Decisions

**`PATCH` not `PUT`:** Partial update semantics — only the fields sent are updated. A `PUT` would require sending the full user object. Since only `email` is editable at MVP, this is clear, but PATCH is the correct HTTP method for partial updates regardless.

**Email change does not require re-verification at MVP:** Requiring re-verification for email changes is the production-correct approach but adds complexity (invalidate session, send new verification email, handle pending email state). For MVP, skip this and note it as a future improvement.

**Omit sensitive fields from all responses:** `passwordHash` and `stripeCustomerId` must never appear in API responses. The service layer should select only the fields needed, not return the full Prisma model.

---

## Done When

- `GET /v1/users/me` with a valid JWT returns the user's profile
- `GET /v1/users/me` without a JWT returns 401
- `PATCH /v1/users/me` with a new unique email updates and returns the profile
- `PATCH /v1/users/me` with an email already used by another account returns 409
- `passwordHash` and `stripeCustomerId` never appear in any response
- `npm run test` passes
