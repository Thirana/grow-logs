# Step 21 — CategoriesModule: Categories CRUD

**Phase:** Phase 7 — CategoriesModule
**Depends on:** Step 13 (CommonModule complete — JwtAuthGuard, ownership utility)

---

## What

Implement the four main category endpoints: list all categories (with subcategories), create a category, rename a category, and delete a category. Subcategories are handled in Step 22.

---

## Why

Categories are the organisational backbone of every log entry. They must exist before entries can be created (Step 23 depends on this). Separating categories from subcategories into two steps keeps each step focused — the delete behaviour differences and foreign key constraints are complex enough to handle one level at a time.

---

## Deliverables

**`packages/schemas/src/categories.ts`:**
```ts
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
});
export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100),
});
```

**`CategoriesModule`** with `CategoriesController` and `CategoriesService`.

**`CategoriesService.findAll(userId)`:**
Returns all categories for the user with their subcategories nested.
```ts
prisma.category.findMany({
  where: { userId },
  include: { subcategories: true },
  orderBy: { createdAt: 'asc' },
})
```

**`CategoriesService.create(userId, dto)`:**
1. Count user's existing categories — throw `UnprocessableEntityException` (422) if count ≥ 5
2. Check for duplicate name (case-insensitive is product decision — document it) — throw `ConflictException` (409) if duplicate
3. Create and return the category

**`CategoriesService.update(userId, categoryId, dto)`:**
1. Find category, call `assertOwnership(category.userId, userId, 'Category')`
2. Check for duplicate name among user's other categories — throw 409 if taken
3. Update and return

**`CategoriesService.delete(userId, categoryId)`:**
1. Find category, call `assertOwnership`
2. Check if any entries reference this category — throw `UnprocessableEntityException` (422) if so: "Cannot delete a category that has log entries attached"
3. Delete (cascades to subcategories automatically via DB constraint)

**Controller endpoints:**
- `GET /v1/categories` — 200
- `POST /v1/categories` — 201
- `PATCH /v1/categories/:id` — 200
- `DELETE /v1/categories/:id` — 204

All protected with `JwtAuthGuard`.

---

## Key Decisions

**422 for "category has entries" (not 409):** 409 is for duplicate resource conflicts. 422 is for unprocessable entity — the request is valid but the business rule prevents it. The distinction matters for clients that inspect status codes.

**422 for "max 5 categories" (not 400):** Same reasoning — the input is valid, but the business rule rejects it. A 400 would imply the request body was malformed.

**Case-sensitive name uniqueness:** The database unique constraint `(userId, name)` is case-sensitive by default in PostgreSQL. MVP uses case-sensitive matching. Document this: "Backend Development" and "backend development" are treated as different names. Normalise to lowercase if you want case-insensitive uniqueness (add a DB-level `LOWER()` index).

**`assertOwnership` throws 404, not 403:** Per the decision in Step 13 — returning 403 reveals the resource exists. 404 reveals nothing.

---

## Done When

- `GET /v1/categories` returns all categories with nested subcategories for the authenticated user
- `POST /v1/categories` creates a category and returns 201
- `POST /v1/categories` with a duplicate name returns 409
- `POST /v1/categories` when user already has 5 categories returns 422
- `PATCH /v1/categories/:id` belonging to a different user returns 404
- `DELETE /v1/categories/:id` with entries attached returns 422
- `DELETE /v1/categories/:id` with no entries returns 204 and cascades to subcategories
- `npm run test` passes
