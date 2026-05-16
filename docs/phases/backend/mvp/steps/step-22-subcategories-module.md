# Step 22 — CategoriesModule: Subcategories CRUD

**Phase:** Phase 7 — CategoriesModule
**Depends on:** Step 21 (categories must exist as parent resources; `is_completed` migration already applied)

> **No new migration needed.** The `is_completed` column and partial indexes for `subcategories` were added in Step 21's migration (`add_is_completed_to_categories_and_subcategories`). The Prisma schema just needs `isCompleted` added to the `Subcategory` model.

---

## What

Implement the three subcategory endpoints nested under categories: create a subcategory, update a subcategory (rename, complete, or reactivate), and delete a subcategory (empty subcategories only). These live inside the same `CategoriesModule` as Step 21 — additions to the existing controller and service.

---

## Why

Subcategories provide finer-grained organisation within a category. They are optional throughout — entries can belong to a category with no subcategory. The completion system applies to subcategories independently of their parent category: a subcategory can be completed while its parent remains active (e.g. "finished the Basics topic within the active Python category").

The delete behaviour has changed from the original design: deleting a subcategory with entries is now blocked. Completion is the correct action when a subcategory has a history. Hard delete is only allowed when the subcategory has no entries at all.

---

## Deliverables

### Prisma schema update

Add `isCompleted` to the `Subcategory` model (column already exists in the DB from Step 21's migration):

```prisma
model Subcategory {
  id          String   @id @default(uuid())
  categoryId  String   @map("category_id")
  userId      String   @map("user_id")
  name        String
  isCompleted Boolean  @default(false) @map("is_completed")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  entries  Entry[]

  @@unique([categoryId, name])
  @@index([categoryId])
  @@index([userId])
  @@map("subcategories")
}
```

---

### `packages/schemas/src/categories.ts` update

```ts
export const createSubcategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateSubcategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isCompleted: z.boolean().optional(),
});
```

`isCompleted` is not in `createSubcategorySchema` — new subcategories are always active.

---

### `CategoriesService` additions

---

**`createSubcategory(userId, categoryId, dto)`:**

1. Find parent category. Call `assertOwnership(category.userId, userId, 'Category')`.
2. Guard: if `category.isCompleted === true` → throw `UnprocessableEntityException` (422):
   `"Cannot add subcategories to a completed category. Reactivate it first."`
3. Count user's **active** subcategories in this category:
   `WHERE categoryId = :categoryId AND isCompleted = false`
4. If count >= 5 (free user) → throw `UnprocessableEntityException` (422):
   `"Free plan allows a maximum of 5 active subcategories per category. Complete an existing subcategory or upgrade to Pro to create more."`
5. Check for duplicate name within the category across all subcategories (active and completed) → throw 409 if taken.
6. Create subcategory with both `categoryId` and `userId` populated.

---

**`updateSubcategory(userId, categoryId, subId, dto)`:**

1. Find subcategory. Verify `subcategory.categoryId === categoryId` — prevents cross-category manipulation.
2. Call `assertOwnership(subcategory.userId, userId, 'Subcategory')`.

**If `dto.name` is present (rename):**
3. Guard: if `subcategory.isCompleted === true` → throw `UnprocessableEntityException` (422):
   `"Cannot rename a completed subcategory. Reactivate it first."`
4. Check for duplicate name within the parent category → throw 409 if taken.
5. Apply name update and return.

**If `dto.isCompleted === true` (complete):**
3. If already completed, proceed silently (idempotent).
4. Set `isCompleted = true` and return.

**If `dto.isCompleted === false` (reactivate):**
3. Fetch parent category. If `category.isCompleted === true` → throw `UnprocessableEntityException` (422):
   `"Cannot reactivate a subcategory while its parent category is completed. Reactivate the parent category first."`
4. Count active subcategories in the category (excluding this one):
   `WHERE categoryId = :categoryId AND isCompleted = false AND id != subId`
5. If count >= 5 (free user) → throw `UnprocessableEntityException` (422):
   `"Free plan allows a maximum of 5 active subcategories per category. Complete another subcategory first or upgrade to Pro."`
6. Set `isCompleted = false` and return.

---

**`deleteSubcategory(userId, categoryId, subId)`:**

Hard delete is only permitted when the subcategory has zero entries.

1. Find subcategory. Verify `subcategory.categoryId === categoryId`.
2. Call `assertOwnership(subcategory.userId, userId, 'Subcategory')`.
3. Count entries: `WHERE subcategoryId = :subId`
4. If count > 0 → throw `UnprocessableEntityException` (422):
   `"Cannot delete a subcategory that has entries. Mark it as complete instead."`
5. Delete. The DB's `ON DELETE SET NULL` on `entries.subcategory_id` remains as a structural safety net but is never reached through normal app usage.

---

### Response shape

All subcategory responses include `isCompleted`:

```json
{
  "data": {
    "id": "uuid",
    "categoryId": "uuid",
    "name": "NestJS",
    "isCompleted": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {}
}
```

### Controller endpoints added to `CategoriesController`

- `POST /v1/categories/:id/subcategories` — 201
- `PATCH /v1/categories/:id/subcategories/:subId` — 200
- `DELETE /v1/categories/:id/subcategories/:subId` — 204

---

## Key Decisions

**Completion replaces delete for non-empty subcategories:** A subcategory with entries cannot be hard deleted — the service blocks it and instructs the user to mark it complete instead. The DB `ON DELETE SET NULL` safety net remains in the schema but is unreachable through normal usage.

**Parent category must be active to reactivate a subcategory:** If the parent category is completed, all its subcategories are implicitly frozen. Reactivating a subcategory while the parent is completed would create an inconsistent state — the subcategory would be "active" but still blocked from accepting entries (because the parent check in `EntriesService.create` guards against completed categories).

**Name uniqueness spans active and completed:** The constraint `(categoryId, name)` applies regardless of completion state. A user cannot create a new "Basics" subcategory if there is already a completed "Basics" under the same category.

**`userId` on subcategories (denormalised):** The schema stores `userId` directly on subcategories even though it is reachable via `categoryId → categories → userId`. This avoids a JOIN on every ownership check. `createSubcategory` must populate this field from the authenticated user's ID.

**Verify `subcategory.categoryId === categoryId` from URL:** A user could construct `PATCH /v1/categories/[their-category]/subcategories/[someone-elses-subcategory]`. Checking that the subcategory's `categoryId` matches the URL param prevents this cross-category manipulation attempt.

---

## Done When

- `POST /v1/categories/:id/subcategories` creates a subcategory under the correct parent and returns 201 with `isCompleted: false`
- `POST /v1/categories/:id/subcategories` on a completed parent category returns 422
- `POST /v1/categories/:id/subcategories` on a category belonging to another user returns 404
- `POST /v1/categories/:id/subcategories` with a duplicate name returns 409
- `POST /v1/categories/:id/subcategories` when category already has 5 active subcategories returns 422
- `PATCH /v1/categories/:id/subcategories/:subId` with `{ "isCompleted": true }` marks subcategory complete
- `PATCH /v1/categories/:id/subcategories/:subId` with `{ "isCompleted": false }` reactivates when parent is active and under limit
- `PATCH /v1/categories/:id/subcategories/:subId` with `{ "isCompleted": false }` when parent is completed returns 422
- `PATCH /v1/categories/:id/subcategories/:subId` with `{ "name": "..." }` on a completed subcategory returns 422
- `PATCH /v1/categories/:id/subcategories/:subId` with wrong `categoryId` in URL returns 404
- `DELETE /v1/categories/:id/subcategories/:subId` with entries attached returns 422
- `DELETE /v1/categories/:id/subcategories/:subId` with no entries returns 204
- `npm run test` passes
