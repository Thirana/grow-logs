# Step 23 — EntriesModule: CRUD

**Phase:** Phase 8 — EntriesModule
**Depends on:** Step 22 (categories and subcategories must exist as valid FK references)

---

## What

Implement the five core entry endpoints: paginated list with filters, create, get single entry, update, and delete. The summary analytics endpoint is handled separately in Step 24.

---

## Why

Entries are the core data of the product — every other feature exists to support logging and reviewing entries. The CRUD operations are implemented before the analytics endpoint because the analytics query is the most complex and should be built on top of a working data layer.

---

## Deliverables

**`packages/schemas/src/entries.ts`:**
```ts
export const entryTypeSchema = z.enum(['WORK', 'LEARNING']);

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createEntrySchema = z.object({
  type: entryTypeSchema,
  text: z.string().min(10).max(1000),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  productivityScore: z.number().int().min(1).max(10).optional(),
  entryDate: dateStringSchema.optional(), // defaults to today server-side; future dates rejected by service
});

export const updateEntrySchema = createEntrySchema.partial();

export const entryFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: entryTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});
```

**`EntriesModule`** with `EntriesController` and `EntriesService`.

**`EntriesService.findAll(userId, filters)`:**
- Build a Prisma `where` clause from filters
- Always scope by `userId`
- Sort by `entryDate DESC` (not `createdAt`)
- Return paginated results with `total` count for the meta envelope

**`EntriesService.create(userId, dto)`:**
1. Resolve `entryDate`: default to today (UTC) if not provided. If provided, validate it is not in the future — throw `UnprocessableEntityException` (422): `"Entry date cannot be in the future."`
2. Verify `categoryId` belongs to `userId` — throw 404 if not found or not owned.
3. Guard: if `category.isCompleted === true` → throw `UnprocessableEntityException` (422): `"Cannot add entries to a completed category. Reactivate it to continue logging."`
4. If `subcategoryId` provided: verify it belongs to `categoryId` — throw 404 if not. Guard: if `subcategory.isCompleted === true` → throw `UnprocessableEntityException` (422): `"Cannot assign entries to a completed subcategory. Reactivate it to use it again."`
5. **Daily entry limit (free users only):** Count entries for this user on the resolved `entryDate`: `WHERE userId = :userId AND entryDate = :entryDate`. If count >= 10 → throw `UnprocessableEntityException` (422): `"You have reached the daily entry limit of 10 for [date]. Upgrade to Pro for unlimited entries."`
6. Create and return with category and subcategory names included.

**`EntriesService.findOne(userId, entryId)`:**
- Find by ID, call `assertOwnership(entry.userId, userId, 'Entry')`
- Include category and subcategory in response

**`EntriesService.update(userId, entryId, dto)`:**
1. Find entry, call `assertOwnership`.
2. If `entryDate` is being changed, validate it is not in the future — throw 422 if so.
3. If `categoryId` is being changed:
   - Verify new category belongs to `userId` — throw 404 if not.
   - Guard: if new `category.isCompleted === true` → throw 422: `"Cannot reassign an entry to a completed category."`
   - If the entry currently has a `subcategoryId` and that subcategory does not belong to the new category, automatically set `subcategoryId = null` in the update payload (do not throw — just clear it silently).
4. Determine the effective `categoryId` (new value if changing, existing value otherwise).
5. If `subcategoryId` is being set (not null):
   - Verify subcategory belongs to the effective `categoryId` — throw 422: `"Subcategory does not belong to the selected category."` if not.
   - Guard: if `subcategory.isCompleted === true` → throw 422: `"Cannot assign entries to a completed subcategory."`
6. Update and return.

**`EntriesService.delete(userId, entryId)`:**
- Find entry, call `assertOwnership`
- Hard delete (no soft delete at MVP)

**Controller endpoints:**
- `GET /v1/entries` — 200, pagination in meta
- `POST /v1/entries` — 201
- `GET /v1/entries/:id` — 200
- `PATCH /v1/entries/:id` — 200
- `DELETE /v1/entries/:id` — 204

**Important:** `GET /v1/entries/summary` must be registered **before** `GET /v1/entries/:id` in the controller to prevent NestJS routing from treating `summary` as a UUID param.

---

## Key Decisions

**Sort by `entryDate`, not `createdAt`:** Users can log past entries with a backdated `entryDate`. The dashboard should show them in the logical chronological order of when the work/learning happened, not when the record was inserted into the database.

**Ownership check via `assertOwnership`, not a scoped query:** Two approaches: (1) `findFirst({ where: { id, userId } })` — returns null if not owned, (2) `findUnique({ where: { id } })` then `assertOwnership`. Approach 1 is slightly more efficient (one query). Approach 2 is used here for consistency with the rest of the codebase. Either is acceptable — pick one and use it everywhere.

**`text` min 10, max 1000 characters:** Enforced in the Zod schema (validated at API boundary). Not a DB check constraint — text length is best validated at the application level.

**`entryDate` defaults to today server-side, future dates rejected:** If the client doesn't send `entryDate`, the service sets it to `new Date()` (UTC date). If the client does send a date, the service validates it is not in the future. The "today" is the server's UTC date, not the user's local date — acceptable at MVP; future versions should accept a timezone parameter.

**Daily entry limit counted by `entryDate`, not `createdAt`:** Users often log yesterday's work today. Counting by `created_at` would penalise users who batch-log in the morning. Counting by `entryDate` is semantically correct: "on day X, you may log at most 10 things that happened on day X." The limit applies to free-tier users only; Pro users have no limit. Check `subscriptionStatus` from the authenticated user's JWT payload (available on `req.user`).

**Subcategory auto-cleared on category change:** When `categoryId` changes and the existing `subcategoryId` does not belong to the new category, `subcategoryId` is silently set to `null` in the update. This is preferable to throwing an error — the user is moving the entry to a new area and it is obvious the old subcategory no longer applies.

**Completion checks on both category and subcategory:** When creating or reassigning an entry, both the category and the subcategory must be active (`isCompleted = false`). The category check happens first (step 3 in create). The subcategory check happens after (step 4 in create). This ordering means the error message always identifies the highest-level problem first.

---

## Done When

- `POST /v1/entries` creates an entry and returns 201 with category and subcategory names
- `POST /v1/entries` with a `categoryId` belonging to another user returns 404
- `POST /v1/entries` with a completed `categoryId` returns 422
- `POST /v1/entries` with a completed `subcategoryId` returns 422
- `POST /v1/entries` with a future `entryDate` returns 422
- `POST /v1/entries` as a free user with 10 entries already on the given `entryDate` returns 422
- `POST /v1/entries` as a free user with 9 entries on the given `entryDate` succeeds (201)
- `GET /v1/entries` returns paginated entries sorted by `entryDate DESC` with correct `meta.total`
- `GET /v1/entries?type=WORK` filters correctly
- `GET /v1/entries?from=2024-01-01&to=2024-01-31` filters by date range correctly
- `GET /v1/entries/:id` for another user's entry returns 404
- `PATCH /v1/entries/:id` with a new `categoryId` from a completed category returns 422
- `PATCH /v1/entries/:id` changing `categoryId` clears `subcategoryId` if it does not belong to the new category
- `DELETE /v1/entries/:id` returns 204 and the record is gone
- `npm run test` passes
