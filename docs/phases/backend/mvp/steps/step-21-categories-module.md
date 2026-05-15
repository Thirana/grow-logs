# Step 21 — CategoriesModule: Categories CRUD

**Phase:** Phase 7 — CategoriesModule
**Depends on:** Step 13 (CommonModule complete — JwtAuthGuard, ownership utility)

> **Migration required:** The `color` column was added to `schema.prisma` during planning (after Step 05). Before writing any service code, run:
> ```bash
> npx prisma migrate dev --name add_color_to_categories
> ```
> This must be the first thing done in this step.

---

## What

Implement the four main category endpoints: list all categories (with subcategories), create a category, rename a category, and delete a category. Subcategories are handled in Step 22.

---

## Why

Categories are the organisational backbone of every log entry. They must exist before entries can be created (Step 23 depends on this). Separating categories from subcategories into two steps keeps each step focused — the delete behaviour differences and foreign key constraints are complex enough to handle one level at a time.

---

## Deliverables

### Prisma schema update

Add a `color` column to the `categories` table:

```prisma
model Category {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String
  color     String   @default("#69B598") @db.VarChar(7)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subcategories Subcategory[]
  entries       Entry[]

  @@unique([userId, name])
  @@map("categories")
}
```

Migration name: `add_color_to_categories`

### `packages/schemas/src/categories.ts`

```ts
// Predefined palette — frontend colour picker restricts to these values
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
});
```

### `CategoriesModule` with `CategoriesController` and `CategoriesService`

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
3. If `dto.color` is not provided, assign the next unused color from `COLOR_PALETTE` (cycle through palette by existing category count: `COLOR_PALETTE[existingCount % COLOR_PALETTE.length]`)
4. Create and return the category

**`CategoriesService.update(userId, categoryId, dto)`:**
1. Find category, call `assertOwnership(category.userId, userId, 'Category')`
2. If renaming: check for duplicate name among user's other categories — throw 409 if taken
3. Update and return

**`CategoriesService.delete(userId, categoryId)`:**
1. Find category, call `assertOwnership`
2. Check if any entries reference this category — throw `UnprocessableEntityException` (422) if so: "Cannot delete a category that has log entries attached"
3. Delete (cascades to subcategories automatically via DB constraint)

### Response shape

All category responses include `color`:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Backend",
      "color": "#69B598",
      "createdAt": "2024-01-15T...",
      "subcategories": [
        { "id": "uuid", "name": "NestJS", "createdAt": "..." }
      ]
    }
  ],
  "meta": {}
}
```

### Controller endpoints
- `GET /v1/categories` — 200
- `POST /v1/categories` — 201
- `PATCH /v1/categories/:id` — 200
- `DELETE /v1/categories/:id` — 204

All protected with `JwtAuthGuard`.

---

## Key Decisions

**`color` as a server-assigned palette value:** The frontend colour picker presents the 8 predefined palette colours. The schema validates against this enum, preventing arbitrary hex values. If the frontend omits `color`, the server cycles through the palette so each new category automatically gets a distinct colour without user input.

**422 for "category has entries" (not 409):** 409 is for duplicate resource conflicts. 422 is for unprocessable entity — the request is valid but the business rule prevents it. The distinction matters for clients that inspect status codes.

**422 for "max 5 categories" (not 400):** Same reasoning — the input is valid, but the business rule rejects it. A 400 would imply the request body was malformed.

**Case-sensitive name uniqueness:** The database unique constraint `(userId, name)` is case-sensitive by default in PostgreSQL. MVP uses case-sensitive matching. Document this: "Backend Development" and "backend development" are treated as different names.

**`assertOwnership` throws 404, not 403:** Per the decision in Step 13 — returning 403 reveals the resource exists. 404 reveals nothing.

---

## Done When

- `GET /v1/categories` returns all categories with `color` field and nested subcategories for the authenticated user
- `POST /v1/categories` without a `color` auto-assigns a palette colour and returns 201
- `POST /v1/categories` with a `color` uses the provided value and returns 201
- `POST /v1/categories` with a duplicate name returns 409
- `POST /v1/categories` when user already has 5 categories returns 422
- `PATCH /v1/categories/:id` can update `color` independently of `name`
- `PATCH /v1/categories/:id` belonging to a different user returns 404
- `DELETE /v1/categories/:id` with entries attached returns 422
- `DELETE /v1/categories/:id` with no entries returns 204 and cascades to subcategories
- `npm run test` passes
