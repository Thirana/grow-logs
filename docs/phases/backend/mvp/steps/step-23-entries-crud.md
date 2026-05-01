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

export const createEntrySchema = z.object({
  type: entryTypeSchema,
  text: z.string().min(10).max(1000),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  productivityScore: z.number().int().min(1).max(10).optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const updateEntrySchema = createEntrySchema.partial();

export const entryFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: entryTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
```

**`EntriesModule`** with `EntriesController` and `EntriesService`.

**`EntriesService.findAll(userId, filters)`:**
- Build a Prisma `where` clause from filters
- Always scope by `userId`
- Sort by `entryDate DESC` (not `createdAt`)
- Return paginated results with `total` count for the meta envelope

**`EntriesService.create(userId, dto)`:**
1. Verify `categoryId` belongs to `userId` — throw 404 if not
2. If `subcategoryId` provided, verify it belongs to `categoryId` — throw 404 if not
3. Default `entryDate` to today if not provided
4. Create and return with category and subcategory names included

**`EntriesService.findOne(userId, entryId)`:**
- Find by ID, call `assertOwnership(entry.userId, userId, 'Entry')`
- Include category and subcategory in response

**`EntriesService.update(userId, entryId, dto)`:**
1. Find entry, call `assertOwnership`
2. If `categoryId` is being changed, verify new category belongs to user
3. If `subcategoryId` is being changed, verify it belongs to the (new or existing) category
4. Update and return

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

**`text` min 10, max 1000 characters:** Enforced in the Zod schema (validated at API boundary) and noted in the DB schema comment. Not a DB check constraint (text length is best validated at application level, not DB level).

**`entryDate` defaults to today server-side:** If the client doesn't send `entryDate`, the service sets it to `new Date()` (UTC date). This should be documented: the "today" is the server's UTC date, not the user's local date. For MVP this is acceptable. Future versions should accept a timezone parameter.

---

## Done When

- `POST /v1/entries` creates an entry and returns 201 with category and subcategory names
- `POST /v1/entries` with a `categoryId` belonging to another user returns 404
- `GET /v1/entries` returns paginated entries sorted by `entryDate DESC` with correct `meta.total`
- `GET /v1/entries?type=WORK` filters correctly
- `GET /v1/entries?from=2024-01-01&to=2024-01-31` filters by date range correctly
- `GET /v1/entries/:id` for another user's entry returns 404
- `DELETE /v1/entries/:id` returns 204 and the record is gone
- `npm run test` passes
