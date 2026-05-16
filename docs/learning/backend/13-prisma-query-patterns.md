# 13 — Prisma Query Patterns

**Phase:** Phase 7–8 (Steps 21–24) | **Concepts:** Prisma Client API, findMany, findUnique, findFirst, create, update, delete, where, include, select, orderBy, pagination, Promise.all, conditional query building

---

## What Prisma Client Is

Prisma Client is an auto-generated, type-safe database client. When you run `prisma generate`, Prisma reads your `schema.prisma` and produces a TypeScript client where every method, every `where` argument, and every returned field is typed to match your schema.

The practical benefit: if you reference a field that does not exist on a model, TypeScript catches it at compile time — before the code reaches the database. The type safety is not a wrapper around a generic query builder; it is generated specifically from your schema, so it knows the exact shape of every table.

In Grow Logs, the Prisma Client is injected through `PrismaService`:

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient {}
```

Every service receives it via constructor injection:

```typescript
constructor(private readonly prisma: PrismaService) {}
```

All database access goes through `this.prisma`.

---

## The Core Read Methods

### `findMany` — List rows matching a condition

```typescript
// entries.service.ts — list entries with filters
const items = await this.prisma.entry.findMany({
  where: {
    userId,
    type: 'WORK',
    entryDate: { gte: new Date('2024-01-01T00:00:00.000Z') },
  },
  skip: 0,
  take: 10,
  orderBy: { entryDate: 'desc' },
  include: {
    category: { select: { id: true, name: true, color: true } },
    subcategory: { select: { id: true, name: true } },
  },
});
```

`findMany` returns an array (possibly empty). It never throws if no rows match — you get `[]`.

### `findUnique` — Fetch exactly one row by primary key or unique field

```typescript
// entries.service.ts — fetch one entry for ownership check
const entry = await this.prisma.entry.findUnique({
  where: { id: entryId },
  include: {
    category: { select: { id: true, name: true, color: true } },
    subcategory: { select: { id: true, name: true } },
  },
});

if (!entry) throw new NotFoundException('Entry not found');
```

`findUnique` requires the `where` to reference a column with a `@unique` or `@id` constraint. It returns the row or `null` — never throws on missing rows. This is why you always check `if (!entry)` after calling it.

### `findFirst` — Fetch the first row matching any condition

```typescript
// categories.service.ts — check for duplicate name
const existing = await this.prisma.category.findFirst({
  where: { userId, name: dto.name },
  select: { id: true },
});

if (existing) {
  throw new ConflictException(`A category named "${dto.name}" already exists.`);
}
```

`findFirst` is like `findMany` but stops at the first match and returns one row or `null`. Use it when you only care whether something exists, not what all matches are.

**`findFirst` vs `findUnique`:**

| | `findUnique` | `findFirst` |
|---|---|---|
| `where` clause | Only unique/primary key fields | Any field combination |
| Result | One row or null | First matching row or null |
| TypeScript types | Fully inferred from unique constraint | More flexible but less strict |
| Performance | Faster — uses the unique index directly | Slightly slower — may scan |

Use `findUnique` when you have a unique or primary key. Use `findFirst` when your filter is a combination of fields that is logically unique but not declared as such in the schema.

---

## The Core Write Methods

### `create` — Insert a new row

```typescript
// entries.service.ts — create a new entry
const entry = await this.prisma.entry.create({
  data: {
    userId,
    type: dto.type,
    text: dto.text,
    categoryId: dto.categoryId,
    subcategoryId: dto.subcategoryId ?? null,
    productivityScore: dto.productivityScore ?? null,
    entryDate: entryDateDb,
  },
  include: {
    category: { select: { id: true, name: true, color: true } },
    subcategory: { select: { id: true, name: true } },
  },
});
```

`create` returns the newly inserted row. You can chain `include` or `select` to control what is returned — Prisma fetches the related rows in the same operation.

If a unique constraint is violated (duplicate name, duplicate primary key), Prisma throws a `PrismaClientKnownRequestError` with code `P2002`. In this repo, the application checks for duplicates before inserting rather than catching that error, because the error message from catching a Prisma code is harder to control and test.

### `update` — Modify an existing row

```typescript
// categories.service.ts — mark category as completed
const updated = await this.prisma.category.update({
  where: { id: categoryId },
  data: { isCompleted: true },
  include: {
    subcategories: {
      select: { id: true, name: true, isCompleted: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    },
  },
});
```

`update` requires a unique `where` — you always update by primary key or unique field. It returns the updated row. If no row matches the `where`, Prisma throws `PrismaClientKnownRequestError` with code `P2025` ("Record to update not found"). In this repo, existence is always checked before updating:

```typescript
const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
if (!category) throw new NotFoundException('Category not found');
// ownership check here
await this.prisma.category.update({ ... });
```

### `delete` — Remove a row

```typescript
// entries.service.ts — delete an entry
await this.prisma.entry.delete({ where: { id: entryId } });
```

`delete` returns the deleted row. In Grow Logs the return value is discarded — what matters is the deletion succeeded. If the row does not exist, Prisma throws `P2025`. Again, in this repo the row is always verified to exist and to be owned before the delete.

---

## `include` vs `select`

Both control what fields come back in the result. They work differently and cannot be used together at the top level.

### `include` — Fetch related rows

`include` fetches related models as nested objects. It always returns all scalar fields on the parent plus the specified relations.

```typescript
// Fetch entry with its full category object
await this.prisma.entry.findUnique({
  where: { id: entryId },
  include: {
    category: true,    // returns all category fields
    subcategory: true, // returns all subcategory fields (or null)
  },
});
```

You can `select` inside an `include` to limit which fields come back from the related model:

```typescript
include: {
  category: { select: { id: true, name: true, color: true } },
  subcategory: { select: { id: true, name: true } },
}
```

This is the pattern used throughout Grow Logs. You almost never want `include: { category: true }` (all fields) because it returns internal fields like `userId` and `isCompleted` on the category that the entry response does not need.

### `select` — Fetch only specific fields

`select` returns only the listed fields from the parent model, with no default fields included.

```typescript
// categories.service.ts — ownership check only needs two fields
const category = await this.prisma.category.findUnique({
  where: { id: categoryId },
  select: { id: true, userId: true },  // only these two fields are fetched
});
```

Use `select` when you only need a subset of a row's columns. This reduces the amount of data transferred from the database. In Grow Logs, ownership checks always use `select` because fetching the full row before deciding whether to proceed is wasteful.

**Rule of thumb:** use `select` for targeted lookups where you know exactly what you need. Use `include` with a nested `select` for fetching related rows alongside the parent.

---

## The `where` Clause

Prisma's `where` object accepts conditions that map to SQL WHERE clauses. The conditions are type-safe — Prisma only allows operators that make sense for each field type.

### Equality

```typescript
where: { userId: 'user-123' }
// SQL: WHERE "userId" = 'user-123'
```

### Range operators (`gte`, `lte`, `gt`, `lt`)

```typescript
where: { entryDate: { gte: new Date('2024-01-01T00:00:00.000Z') } }
// SQL: WHERE "entryDate" >= '2024-01-01T00:00:00.000Z'

where: { entryDate: { gte: start, lt: end } }
// SQL: WHERE "entryDate" >= start AND "entryDate" < end
```

### Negation (`not`)

```typescript
// Check active categories excluding the one being reactivated
where: { userId, isCompleted: false, id: { not: categoryId } }
// SQL: WHERE "userId" = ... AND "isCompleted" = false AND "id" != categoryId
```

### `in` — Match any value in a list

```typescript
// categories.service.ts (inside getSummary)
where: { id: { in: categoryIds } }
// SQL: WHERE "id" IN ('cat-1', 'cat-2', 'cat-3')
```

### Null checks (`not: null`)

```typescript
// Only entries that have a productivity score
where: { productivityScore: { not: null } }
// SQL: WHERE "productivityScore" IS NOT NULL
```

---

## Conditional Query Building

Not all filters are always present. In Grow Logs, `findAll` for entries supports optional filters: type, categoryId, date range. The pattern is to build the `where` object conditionally:

```typescript
// entries.service.ts
const where = {
  userId,
  ...(type ? { type } : {}),
  ...(categoryId ? { categoryId } : {}),
  ...(from || to
    ? {
        entryDate: {
          ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
          ...(to ? { lte: new Date(`${to}T00:00:00.000Z`) } : {}),
        },
      }
    : {}),
};
```

The spread operator (`...`) merges the conditional fields into the base object. If `type` is undefined, the spread adds nothing. If `type` is `'WORK'`, it adds `{ type: 'WORK' }`. The result is a `where` object that only contains the filters the caller actually requested.

This is cleaner than building a SQL string manually or stacking `if` blocks. Prisma handles the SQL generation — your job is to produce a valid `where` object.

---

## Pagination: `skip` and `take`

Offset-based pagination uses two parameters:

- `take` — how many rows to return (the page size, i.e. `limit`)
- `skip` — how many rows to skip before starting to return (calculated from `page` and `limit`)

```typescript
// entries.service.ts
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  this.prisma.entry.findMany({ where, skip, take: limit, orderBy: { entryDate: 'desc' } }),
  this.prisma.entry.count({ where }),
]);
```

**Why fetch `total` alongside the items?**

The frontend needs `total` to calculate `totalPages` and decide whether to show a "next page" button. Without it, the client would have to request the next page and check if it came back empty. Fetching both in parallel (via `Promise.all`) means no extra round-trip.

**`totalPages` calculation:**

```typescript
// entries.controller.ts
totalPages: Math.ceil(total / filters.limit)
```

`Math.ceil` is used because if there are 11 items and the page size is 10, there are 2 pages (the second has 1 item). `Math.floor` would incorrectly return 1.

**The downside of offset pagination:**

If the dataset changes between page loads (new rows inserted), items can appear twice or be skipped. A user on page 2 might see the same item that was on page 1 because a new item was inserted and pushed everything forward. This is an accepted trade-off for most CRUD applications at MVP stage. Cursor-based pagination avoids this problem at the cost of more complexity.

---

## `count` — Count matching rows

```typescript
// categories.service.ts — check how many active categories the user has
const activeCount = await this.prisma.category.count({
  where: { userId, isCompleted: false },
});

if (activeCount >= FREE_TIER_CATEGORY_LIMIT) {
  throw new UnprocessableEntityException('...');
}
```

`count` returns an integer. It applies the same `where` filters as `findMany` but returns no rows — just the count. This is cheaper than `findMany` when you only need to know how many rows exist.

---

## Parallel Queries with `Promise.all`

Multiple independent database queries should run in parallel, not sequentially. `Promise.all` fires all queries at the same time and waits for all of them to complete.

```typescript
// categories.service.ts — three checks before creating a category
const [activeCount, totalCount, existing] = await Promise.all([
  this.prisma.category.count({ where: { userId, isCompleted: false } }),
  this.prisma.category.count({ where: { userId } }),
  this.prisma.category.findFirst({ where: { userId, name: dto.name }, select: { id: true } }),
]);
```

Without `Promise.all`, these three queries would run one after another — each waiting for the previous to finish before starting. With `Promise.all`, all three are sent to the database simultaneously. The total time is roughly the duration of the slowest query, not the sum of all three.

**When to use `Promise.all`:**

Use it when the queries are independent — none of them needs the result of another to form their input. In the example above, the three count/findFirst queries do not depend on each other. They can all be asked simultaneously.

**When NOT to use `Promise.all`:**

When one query's input depends on another query's output. In `getSummary`, the category `findMany` for metadata depends on the `categoryIds` extracted from the `groupBy` result:

```typescript
// entries.service.ts — sequential because categoryIds come from parallel step
const [/* ...9 parallel queries... */] = await Promise.all([...]);

// This must come after — it needs the categoryIds from byCategoryTypeRaw above
const categories = await this.prisma.category.findMany({
  where: { id: { in: categoryIds } },
});
```

---

## Interview Summary

**Q: What is the difference between `findUnique` and `findFirst`?**

> `findUnique` requires a `where` referencing a primary key or unique field, and the database uses that index directly. `findFirst` accepts any filter and returns the first matching row. Use `findUnique` when you have a unique key; use `findFirst` when you need to filter by a non-unique combination of fields.

**Q: What is the difference between `include` and `select` in Prisma?**

> `include` fetches related models (rows from other tables) as nested objects — it always returns all scalar fields on the parent plus the specified relations. `select` fetches only the listed fields from the parent model with no defaults. You can combine them: `include` with a nested `select` limits which fields come back from the related model.

**Q: Why do you check for a row's existence before calling `update` or `delete`?**

> Prisma throws a `PrismaClientKnownRequestError` if the row does not exist, but that error gives you no control over the HTTP status code or error message. By checking existence first and throwing a `NotFoundException` explicitly, you control the response the client receives and you can include the ownership check in the same lookup — confirming the row both exists and belongs to the requesting user.

**Q: Why use `Promise.all` for multiple database queries?**

> Independent queries sent sequentially add their latencies together. `Promise.all` sends all independent queries simultaneously, so the total wait is the duration of the slowest query rather than the sum of all. In the categories create flow, three separate checks (active count, total count, duplicate name) run in parallel, roughly tripling throughput for that operation.

**Q: Why does pagination fetch `total` alongside the page of items?**

> The frontend needs the total count to render page navigation (how many pages are there, should the next button be enabled). Without it, the client would need a separate request or would have to request pages until one comes back empty. Fetching both in a `Promise.all` costs nothing extra in latency.
