# Step 21 — CategoriesModule: Categories CRUD

**Phase:** Phase 7 — CategoriesModule
**Depends on:** Step 13 (CommonModule complete — JwtAuthGuard, ownership utility)

> **Two migrations required before writing any service code:**
>
> ```bash
> # 1. Add color column (planned during schema design phase)
> npx prisma migrate dev --name add_color_to_categories
>
> # 2. Add is_completed to categories and subcategories (decided during product limit finalisation)
> npx prisma migrate dev --name add_is_completed_to_categories_and_subcategories
> ```
>
> Both must be run in order before implementing any service logic. The second migration also covers the `subcategories` table even though subcategory endpoints are implemented in Step 22 — both columns are added in one coordinated migration.

---

## What

Implement the four main category endpoints: list all categories (with subcategories), create a category, update a category (rename, recolor, complete, or reactivate), and delete a category (empty categories only). Subcategory endpoints are added in Step 22.

---

## Why

Categories are the organisational backbone of every log entry. They must exist before entries can be created (Step 23 depends on this). The completion system replaces hard delete for non-empty categories — a category with entries can be marked complete (frozen, but visible and included in analytics) rather than deleted. This preserves historical data while keeping the active workspace clean.

---

## Deliverables

### Migration 1: `add_color_to_categories`

```sql
ALTER TABLE categories ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '#69B598';
```

Prisma schema after migration:

```prisma
model Category {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  name        String
  color       String   @default("#69B598") @db.VarChar(7)
  isCompleted Boolean  @default(false) @map("is_completed")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subcategories Subcategory[]
  entries       Entry[]

  @@unique([userId, name])
  @@index([userId])
  @@map("categories")
}
```

### Migration 2: `add_is_completed_to_categories_and_subcategories`

```sql
ALTER TABLE categories    ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE subcategories ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT false;

-- Partial indexes for the dominant query pattern (fetch active items)
CREATE INDEX idx_categories_user_id_active
  ON categories (user_id)
  WHERE is_completed = false;

CREATE INDEX idx_subcategories_category_id_active
  ON subcategories (category_id)
  WHERE is_completed = false;
```

**Why `BOOLEAN` and not a string enum:** Only two states exist (active / completed). `BOOLEAN` is 1 byte per row. The partial indexes above contain only active rows — smaller, faster to scan, and cover the hot path without needing an enum type.

---

### `packages/schemas/src/categories.ts`

```ts
const COLOR_PALETTE = [
  '#69B598', '#8285BA', '#B87DA2', '#C4A05E',
  '#62AEBF', '#B87060', '#7DB8B0', '#A87DB8',
] as const;

export const colorSchema = z.enum(COLOR_PALETTE);

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  color: colorSchema.optional(), // server assigns from palette if omitted
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: colorSchema.optional(),
  isCompleted: z.boolean().optional(),
});
```

`isCompleted` is not in `createCategorySchema` — new categories are always active.

---

### `CategoriesModule` with `CategoriesController` and `CategoriesService`

---

**`CategoriesService.findAll(userId, filters?)`:**

Returns all categories for the user (active and completed) with subcategories nested. Supports an optional `isCompleted` filter for callers that need only active categories (e.g. the entry form dropdown).

```ts
prisma.category.findMany({
  where: {
    userId,
    ...(filters?.isCompleted !== undefined
      ? { isCompleted: filters.isCompleted }
      : {}),
  },
  include: { subcategories: { orderBy: { createdAt: 'asc' } } },
  orderBy: { createdAt: 'asc' },
})
```

**Default behaviour (no filter): returns all categories.** The settings page and analytics need the full list. The entry form passes `?isCompleted=false` to get only active categories for the dropdown.

---

**`CategoriesService.create(userId, dto)`:**

1. Count user's **active** categories: `WHERE userId = :userId AND isCompleted = false`
2. If count >= 3 (free user) → throw `UnprocessableEntityException` (422):
   `"Free plan allows a maximum of 3 active categories. Complete an existing category or upgrade to Pro to create more."`
3. Check for duplicate name across **all** categories (active and completed) — throw `ConflictException` (409) if taken. Name uniqueness applies regardless of completion state to prevent confusion when reactivating.
4. If `dto.color` not provided, auto-assign: `COLOR_PALETTE[totalCategoryCount % COLOR_PALETTE.length]` (uses total count including completed so colour cycling continues naturally)
5. Create and return

---

**`CategoriesService.update(userId, categoryId, dto)`:**

Handles four operations depending on what fields are in `dto`. Each has its own validation path.

1. Find the category. Call `assertOwnership(category.userId, userId, 'Category')`.

**If `dto.name` or `dto.color` is present (rename / recolor):**
2. Guard: if `category.isCompleted === true` → throw `UnprocessableEntityException` (422):
   `"Cannot rename or recolor a completed category. Reactivate it first."`
3. If renaming: check for duplicate name among user's other categories → throw 409 if taken
4. Apply name/color update and return

**If `dto.isCompleted === true` (complete):**
2. If already completed, proceed silently (idempotent — no error)
3. Set `isCompleted = true`. Do not touch subcategories — their individual flags are unchanged. The service layer enforces that entries cannot be created in a completed category regardless of subcategory state.
4. Return updated category

**If `dto.isCompleted === false` (reactivate):**
2. Count current active categories: `WHERE userId = :userId AND isCompleted = false AND id != categoryId`
3. If count >= 3 (free user) → throw `UnprocessableEntityException` (422):
   `"Free plan allows a maximum of 3 active categories. Complete another category first or upgrade to Pro."`
4. Set `isCompleted = false` and return

---

**`CategoriesService.delete(userId, categoryId)`:**

Hard delete is only permitted when the category has zero entries.

1. Find the category. Call `assertOwnership`.
2. Count entries: `WHERE categoryId = :categoryId`
3. If count > 0 → throw `UnprocessableEntityException` (422):
   `"Cannot delete a category that has entries. Mark it as complete instead."`
4. Delete. The DB CASCADE on `subcategories.category_id` removes all subcategories automatically.

---

### Response shape

All category responses include `color` and `isCompleted`. Subcategories in the nested list include `isCompleted`:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Backend",
      "color": "#69B598",
      "isCompleted": false,
      "createdAt": "2024-01-15T...",
      "subcategories": [
        {
          "id": "uuid",
          "name": "NestJS",
          "isCompleted": false,
          "createdAt": "2024-01-15T..."
        }
      ]
    }
  ],
  "meta": {}
}
```

### Controller endpoints

- `GET /v1/categories` — 200, accepts optional `?isCompleted=false` query param
- `POST /v1/categories` — 201
- `PATCH /v1/categories/:id` — 200
- `DELETE /v1/categories/:id` — 204

All protected with `JwtAuthGuard`.

---

## Key Decisions

**`color` as a server-assigned palette value:** The frontend colour picker presents the 8 predefined palette colours. The schema validates against this enum, preventing arbitrary hex values. If the frontend omits `color`, the server cycles through the palette so each new category automatically gets a distinct colour.

**Completion replaces delete for non-empty categories:** A category with entries cannot be hard deleted — the service blocks it and instructs the user to mark it complete instead. This preserves all historical data and analytics. The DB `ON DELETE RESTRICT` on `entries.category_id` remains as a structural safety net, but the service-layer guard means normal usage never reaches it.

**Name uniqueness spans active and completed:** The constraint `(userId, name)` applies to all categories regardless of completion state. A user cannot create an active "Python" category if they have a completed "Python" category. This prevents confusion if a completed category is later reactivated.

**Reactivation checks active count, not total:** Only active categories count toward the free tier limit. Reactivation is allowed when `activeCount < 3` (for free users). The check excludes the current category being reactivated from the count.

**`isCompleted: true` is idempotent, `isCompleted: false` is not:** Completing an already-completed category does nothing (no error). Reactivating a category has side-effects (active count check) so it errors if over limit — it is not idempotent.

**Subcategory flags are independent of category flag:** Completing a category does not automatically complete its subcategories. The service blocks entry creation in a completed category regardless of subcategory state. Reactivating a category does not auto-reactivate subcategories — the user does so explicitly.

**422 for limit and business rule errors, not 400:** The input is structurally valid. 422 means the business rule prevents it. 400 would imply the request body was malformed.

**`assertOwnership` throws 404, not 403:** Per the decision in Step 13 — returning 403 reveals the resource exists. 404 reveals nothing.

**Case-sensitive name uniqueness:** The DB constraint `(userId, name)` is case-sensitive in PostgreSQL. "Backend" and "backend" are different names. This is documented behaviour.

---

## Done When

- `GET /v1/categories` returns all categories (active and completed) with `color`, `isCompleted`, and nested subcategories
- `GET /v1/categories?isCompleted=false` returns only active categories
- `POST /v1/categories` without `color` auto-assigns a palette colour and returns 201
- `POST /v1/categories` when user already has 3 active categories returns 422
- `POST /v1/categories` with a name that matches an existing completed category returns 409
- `PATCH /v1/categories/:id` with `{ "isCompleted": true }` marks the category complete, returns 200
- `PATCH /v1/categories/:id` with `{ "isCompleted": false }` reactivates the category when under the active limit
- `PATCH /v1/categories/:id` with `{ "isCompleted": false }` when already at the active limit returns 422
- `PATCH /v1/categories/:id` with `{ "name": "..." }` on a completed category returns 422
- `PATCH /v1/categories/:id` belonging to a different user returns 404
- `DELETE /v1/categories/:id` with entries attached returns 422
- `DELETE /v1/categories/:id` with no entries returns 204 and subcategories are cascade-deleted
- `npm run test` passes
