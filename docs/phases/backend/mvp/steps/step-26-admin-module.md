# Step 26 — AdminModule

**Phase:** Phase 9 — FeatureFlagsModule + AdminModule
**Depends on:** Step 25 (FeatureFlagsModule must exist for cache invalidation), Step 13 (RolesGuard)

---

## What

Implement two admin-only endpoints: a paginated list of all users (for platform management), and a feature flag toggle (for enabling non-MVP features). Both require the `ADMIN` role — regular users receive a 403.

---

## Why

Admin endpoints are essential for operating the platform. Without them, managing users and toggling feature flags requires direct database access, which is impractical and risky in production. These endpoints are the operator interface for the platform.

This is the final step of the backend MVP. Completing it means all 22 API endpoints from the API contract are implemented.

---

## Deliverables

**`AdminModule`** with `AdminController` and `AdminService`. Import `FeatureFlagsModule` to access `FeatureFlagsService`.

**`packages/schemas/src/admin.ts`:**
```ts
export const adminUserFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['USER', 'ADMIN']).optional(),
  subscriptionStatus: z.enum(['FREE', 'ACTIVE', 'CANCELLED', 'PAST_DUE']).optional(),
});

export const toggleFlagSchema = z.object({
  enabled: z.boolean(),
});
```

**`AdminService.getUsers(filters)`:**
- Paginated query on the `users` table with optional `role` and `subscriptionStatus` filters
- Returns user list without `passwordHash` or `stripeCustomerId`
- Returns pagination meta

**`AdminService.toggleFlag(key, enabled)`:**
1. Find flag by `key` — throw `NotFoundException` (404) if not found
2. Update `enabled` on the flag record
3. Call `featureFlagsService.refreshCache()` to invalidate the in-memory cache immediately
4. Return updated flag

**Controller endpoints:**
- `GET /v1/admin/users` — protected, ADMIN only
- `PATCH /v1/admin/feature-flags/:key` — protected, ADMIN only

Apply `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)` at the **controller class level** so all routes in the controller inherit both guards.

**Response for `PATCH /v1/admin/feature-flags/:key`:**
```json
{
  "data": {
    "key": "ai_weekly_summary",
    "enabled": true,
    "updatedAt": "ISO8601"
  },
  "meta": {}
}
```

---

## Key Decisions

**Guards at class level, not method level:** Applying `@UseGuards` and `@Roles` at the controller class means every route in `AdminController` requires admin access. No route can accidentally be left unprotected by forgetting to add the decorators to a new method.

**`refreshCache()` called synchronously after toggle:** Toggling a flag and then having the cache serve the old value for up to 60 seconds would be confusing in production. Calling `refreshCache()` immediately means the change is visible to the next request. The slight overhead of a database query here is acceptable — flag toggles are infrequent admin operations.

**Admin user list omits `passwordHash` and `stripeCustomerId`:** Same rule as UsersModule — sensitive fields never leave the server in API responses. The select projection must be explicit.

**No soft-delete or deactivation endpoint at MVP:** User management at MVP means visibility only. Deactivating accounts, resetting passwords, and impersonating users are post-MVP admin capabilities. The user list endpoint is read-only for now.

---

## Done When

- `GET /v1/admin/users` with a USER-role JWT returns 403
- `GET /v1/admin/users` with an ADMIN-role JWT returns paginated user list
- `GET /v1/admin/users?role=ADMIN` filters correctly
- `PATCH /v1/admin/feature-flags/ai_weekly_summary` with `{ "enabled": true }` returns 200 with updated flag
- After toggle, `GET /v1/feature-flags` immediately returns the updated value (cache invalidated)
- `PATCH /v1/admin/feature-flags/nonexistent_key` returns 404
- `passwordHash` and `stripeCustomerId` never appear in user list responses
- `npm run test` passes
- **All 22 API endpoints from `docs/API_CONTRACT.md` are now implemented**
