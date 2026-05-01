# Step 22 — CategoriesModule: Subcategories CRUD

**Phase:** Phase 7 — CategoriesModule
**Depends on:** Step 21 (categories must exist as parent resources)

---

## What

Implement the three subcategory endpoints nested under categories: create a subcategory, rename a subcategory, and delete a subcategory. These live inside the same `CategoriesModule` as Step 21 — they are additions to the existing controller and service.

---

## Why

Subcategories provide finer-grained organisation within a category. They are optional throughout (entries can belong to a category without a subcategory), but the management endpoints must exist so users can set them up in the settings page.

The delete behaviour is different from categories: deleting a subcategory does NOT delete its entries — entries retain their main category but lose the subcategory reference (`SET NULL`). This must be handled correctly.

---

## Deliverables

**`packages/schemas/src/categories.ts` update:**
```ts
export const createSubcategorySchema = z.object({
  name: z.string().min(1).max(100),
});
export const updateSubcategorySchema = z.object({
  name: z.string().min(1).max(100),
});
```

**`CategoriesService` additions:**

**`createSubcategory(userId, categoryId, dto)`:**
1. Find parent category, call `assertOwnership(category.userId, userId, 'Category')` — parent must belong to user
2. Check for duplicate name within the category — throw 409 if taken
3. Create subcategory with both `categoryId` and `userId` (denormalised field as per schema design)

**`updateSubcategory(userId, categoryId, subId, dto)`:**
1. Find subcategory, verify `subcategory.categoryId === categoryId` (prevents cross-category manipulation)
2. Call `assertOwnership(subcategory.userId, userId, 'Subcategory')`
3. Check for duplicate name within the parent category — throw 409 if taken
4. Update and return

**`deleteSubcategory(userId, categoryId, subId)`:**
1. Find subcategory, verify `subcategory.categoryId === categoryId`
2. Call `assertOwnership(subcategory.userId, userId, 'Subcategory')`
3. Delete — the DB's `ON DELETE SET NULL` handles nullifying `entries.subcategory_id` automatically

**Controller endpoints added to `CategoriesController`:**
- `POST /v1/categories/:id/subcategories` — 201
- `PATCH /v1/categories/:id/subcategories/:subId` — 200
- `DELETE /v1/categories/:id/subcategories/:subId` — 204

---

## Key Decisions

**`userId` on subcategories (denormalised):** The schema stores `userId` directly on the `subcategories` table even though it could be derived via `categoryId → categories → userId`. This is explained in `DECISIONS.md` — it avoids a JOIN on every ownership check. The `createSubcategory` service must populate this field explicitly from the authenticated user's ID.

**Verify `subcategory.categoryId === categoryId` from URL:** A user could construct a request to `PATCH /v1/categories/[their-category-id]/subcategories/[someone-elses-subcategory-id]`. Checking that the subcategory's `categoryId` matches the URL parameter prevents this cross-category manipulation.

**`SET NULL` deletion — no warning in this API layer:** The API contract says entries retain their category and lose their subcategory reference on subcategory deletion. The 204 response does not include a count of affected entries. The frontend is responsible for showing a warning before the user deletes a subcategory that has entries attached (the frontend can query entry counts before calling DELETE).

---

## Done When

- `POST /v1/categories/:id/subcategories` creates a subcategory under the correct parent and returns 201
- `POST /v1/categories/:id/subcategories` on a category belonging to another user returns 404
- `POST /v1/categories/:id/subcategories` with a duplicate name returns 409
- `DELETE /v1/categories/:id/subcategories/:subId` returns 204 and any entries that referenced the subcategory now have `subcategoryId: null`
- `PATCH /v1/categories/:id/subcategories/:subId` with wrong `categoryId` in URL returns 404
- `npm run test` passes
