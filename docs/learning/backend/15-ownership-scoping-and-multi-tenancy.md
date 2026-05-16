# 15 — Ownership Scoping and Multi-tenancy

**Phase:** Phase 7–8 (Steps 21–24) | **Concepts:** Multi-tenancy, ownership scoping, row-level access control, assertOwnership, JWT-derived userId, horizontal isolation, the lookup-then-check pattern

---

## What Multi-tenancy Means

Grow Logs is a **multi-tenant** application. Many users store their data in the same database tables. The `entries` table is not per-user — it holds entries for every user who has ever signed up. The `categories` table is the same.

The database itself has no concept of "this user should only see their own rows". It will happily return any row to any query. The enforcement of "users can only see their own data" is entirely an application responsibility.

This is called **row-level access control** or **ownership scoping**. Every query that reads or modifies data must include the owner's user ID as a filter. Without it, a user could read or modify data belonging to someone else.

---

## Where `userId` Comes From

After a successful login, the server issues a JWT access token. The JWT payload includes the user's ID:

```typescript
// auth.service.ts — building the access token payload
const accessToken = this.jwtService.sign({
  sub: user.id,             // userId
  role: user.role,
  subscriptionStatus: user.subscriptionStatus,
});
```

On every subsequent request, `JwtAuthGuard` validates the token and calls `JwtStrategy.validate()`, which extracts the payload and attaches it to `req.user`:

```typescript
// jwt.strategy.ts
validate(payload: { sub: string; role: UserRole; subscriptionStatus: SubscriptionStatus }): AuthenticatedUser {
  return {
    userId: payload.sub,
    role: payload.role,
    subscriptionStatus: payload.subscriptionStatus,
  };
}
```

The `@CurrentUser()` decorator in controllers reads this from `req.user`:

```typescript
// entries.controller.ts
async findAll(@CurrentUser() user: AuthenticatedUser, ...) {
  const { items, total } = await this.entriesService.findAll(user.userId, filters);
}
```

The `userId` the service receives comes from the verified JWT, not from the request body or URL. This is the critical design decision: **the ownership identity is established by the authentication layer, not by client input**.

---

## Why You Must Never Trust Client-Supplied User IDs

If `userId` came from a query parameter or request body, any user could pass any userId they wanted:

```
GET /api/v1/entries?userId=some-other-user-id   ← never do this
```

Alternatively, if entries were fetched by `entryId` alone without checking `userId`:

```typescript
// Unsafe — returns ANY entry regardless of who owns it
const entry = await this.prisma.entry.findUnique({ where: { id: entryId } });
```

A malicious user who knows (or guesses) another user's entry ID could retrieve, modify, or delete it. UUIDs are not secret — they are sent in API responses and often appear in browser history.

The correct approach: the `userId` is extracted from the JWT by the authentication layer and passed into every service method. Service methods never accept `userId` from the request body.

---

## The Two-Step Ownership Pattern

Reading or modifying a resource by ID follows a consistent two-step pattern throughout Grow Logs:

**Step 1:** Fetch the row by its ID. Check if it exists. If it does not, throw 404.

**Step 2:** Verify that the row's `userId` matches the `userId` from the JWT. If they do not match, also throw 404 (not 403 — explained below).

```typescript
// entries.service.ts — findOne
const entry = await this.prisma.entry.findUnique({
  where: { id: entryId },
  include: { ... },
});

if (!entry) throw new NotFoundException('Entry not found');
assertOwnership(entry.userId, userId, 'Entry');
```

### Why 404 instead of 403 when ownership fails?

Returning 403 Forbidden when a user requests someone else's resource confirms that the resource exists and belongs to someone else. This is an information leak — a malicious user could enumerate IDs to discover which ones are valid and which users own them.

Returning 404 Not Found regardless of whether the row exists or just belongs to someone else reveals nothing. From the attacker's perspective, the response is identical whether the ID doesn't exist or is owned by another user.

This is a standard security pattern called **security through ambiguity** — not the only line of defence, but a cheap and correct one.

---

## `assertOwnership`: The Utility Function

Because this two-step check is repeated in every service method, it is extracted into a shared utility:

```typescript
// common/utils/ownership.util.ts
import { NotFoundException } from '@nestjs/common';

export function assertOwnership(resourceUserId: string, requestingUserId: string, resourceName: string): void {
  if (resourceUserId !== requestingUserId) {
    throw new NotFoundException(`${resourceName} not found`);
  }
}
```

Usage:

```typescript
assertOwnership(entry.userId, userId, 'Entry');
assertOwnership(category.userId, userId, 'Category');
assertOwnership(subcategory.userId, userId, 'Subcategory');
```

It throws `NotFoundException` (404) — not a 403 — keeping the security pattern consistent.

By centralising this logic, you ensure the pattern is applied identically everywhere. If the requirements change (e.g. you want to log ownership violations), you change one function, not every service.

---

## Scoping Every Database Query by `userId`

For **list queries** (findAll), `userId` goes directly in the `where` clause. The database filters out rows that do not belong to the requesting user before returning anything:

```typescript
// entries.service.ts — findAll
const where = {
  userId,              // ← always the first filter
  ...(type ? { type } : {}),
  ...(categoryId ? { categoryId } : {}),
  ...
};

const items = await this.prisma.entry.findMany({ where, ... });
```

For **single-resource queries** (findOne, update, delete), the fetch-then-check pattern is used because `userId` is not a unique identifier for an entry — you cannot do `findUnique({ where: { id: entryId, userId } })` since only `id` is unique. The pattern is:

```typescript
// 1. Fetch by unique ID
const entry = await this.prisma.entry.findUnique({ where: { id: entryId } });

// 2. Check existence
if (!entry) throw new NotFoundException('Entry not found');

// 3. Check ownership
assertOwnership(entry.userId, userId, 'Entry');

// 4. Now safe to act on the entry
```

**Why not filter by `id` AND `userId` together?**

You could write:

```typescript
const entry = await this.prisma.entry.findFirst({
  where: { id: entryId, userId },
});
if (!entry) throw new NotFoundException('Entry not found');
```

This works and skips the explicit `assertOwnership` call. It is a valid approach. The `findUnique` + `assertOwnership` pattern is used in this repo because:
1. It uses `findUnique` (faster, index-backed) rather than `findFirst`
2. The `assertOwnership` call makes the ownership check visible and explicit — it is harder to accidentally omit a named function call than to forget to add a field to a where clause

---

## Aggregation Queries Are Also Scoped

It is easy to remember to scope `findMany` and `findUnique` queries. It is easier to forget to scope aggregation queries. In Grow Logs, every aggregation query in `getSummary` starts with `userId`:

```typescript
// entries.service.ts — all aggregation queries include userId in baseWhere
const baseWhere = { userId, ...dateFilter, ...typeFilter };

// Every parallel query uses this scoped where:
this.prisma.entry.aggregate({ where: baseWhere, ... })
this.prisma.entry.groupBy({ by: ['type'], where: baseWhere, ... })
this.prisma.entry.groupBy({ by: ['categoryId', 'type'], where: baseWhere, ... })
// ...
```

Without `userId` in the aggregation `where`, the totals, counts, and averages would be computed across all users in the database. The dashboard would show a mix of every user's data — a serious data breach.

The streak calculation fetches distinct dates:

```typescript
this.prisma.entry.findMany({
  where: { userId },            // ← userId filter even here
  select: { entryDate: true },
  distinct: ['entryDate'],
  orderBy: { entryDate: 'desc' },
});
```

---

## Subcategories: Double Ownership Check

Subcategories introduce a nested ownership structure. A subcategory belongs to a category, which belongs to a user. The service validates both layers:

```typescript
// categories.service.ts — createSubcategory
const category = await this.prisma.category.findUnique({
  where: { id: categoryId },
  select: { id: true, userId: true, isCompleted: true },
});

if (!category) throw new UnprocessableEntityException('Category not found');
assertOwnership(category.userId, userId, 'Category');
```

For entry updates that reassign a subcategory, the check verifies the subcategory belongs to the correct category (and therefore the correct user):

```typescript
// entries.service.ts — update, subcategory reassignment
const sub = await this.prisma.subcategory.findUnique({
  where: { id: dto.subcategoryId },
  select: { id: true, categoryId: true, isCompleted: true },
});

if (!sub || sub.categoryId !== effectiveCategoryId) {
  throw new UnprocessableEntityException(
    'Subcategory does not belong to the selected category.',
  );
}
```

Notice: the subcategory check verifies `categoryId` matches, not `userId` directly. Because `categories` is already ownership-verified (only the user's categories are considered as `effectiveCategoryId`), verifying the subcategory belongs to that category is sufficient. The ownership chain is: entry → category (verified) → subcategory (verified by categoryId).

This is also why `userId` is denormalised onto `subcategories` — so direct subcategory lookups can do a single-table ownership check without joining through `categories`.

---

## The Complete Ownership Chain

Every table traces ownership back to `users`:

```
users (id)
  ↳ categories (userId → users.id)
      ↳ subcategories (userId → users.id, categoryId → categories.id)
      ↳ entries (userId → users.id, categoryId → categories.id)
```

The `userId` column on every resource table is the ownership anchor. Every query in every service starts from or checks this anchor.

---

## What Goes Wrong Without Ownership Scoping

A concrete example of what an unsecured endpoint looks like and what it enables:

```typescript
// Unsecured — never do this
async findOne(entryId: string): Promise<EntryResponse> {
  const entry = await this.prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry) throw new NotFoundException('Entry not found');
  return this.toResponse(entry);
}
```

With this implementation, any authenticated user can retrieve any other user's entry by its ID. They do not need to know the other user's password — just their entry ID. Since IDs appear in API responses, anyone who has ever shared a screenshot, inspected network traffic, or accessed API logs has entry IDs they could use.

The fix is exactly the pattern used throughout this repo:

```typescript
// Secured
async findOne(userId: string, entryId: string): Promise<EntryResponse> {
  const entry = await this.prisma.entry.findUnique({ where: { id: entryId }, include: { ... } });
  if (!entry) throw new NotFoundException('Entry not found');
  assertOwnership(entry.userId, userId, 'Entry');
  return this.toResponse(entry);
}
```

Two lines added. The `userId` parameter comes from the JWT. The `assertOwnership` call checks it. Without both, the endpoint is insecure.

---

## Interview Summary

**Q: What is multi-tenancy and how does Grow Logs implement it?**

> Multi-tenancy means multiple users share the same database tables. Grow Logs implements row-level isolation by including `userId` in every database query. The `userId` is extracted from the verified JWT by the authentication layer — it never comes from client-supplied input. This guarantees each user's queries are scoped only to their own data.

**Q: Why does an ownership check return 404 instead of 403?**

> Returning 403 would confirm to an attacker that the resource exists and belongs to another user, letting them enumerate valid IDs. Returning 404 regardless of whether the resource does not exist or belongs to a different user reveals nothing. The attacker cannot distinguish "doesn't exist" from "belongs to someone else."

**Q: Why is `assertOwnership` a separate utility function rather than inline code?**

> Centralising the check ensures it is applied consistently. If you forget to add inline ownership logic in a new service method, there is no warning. A named function call is harder to accidentally omit. It also ensures the thrown exception type (404, not 403) and message format are identical everywhere.

**Q: Why does `userId` need to be in aggregation queries like `groupBy`?**

> Aggregation queries without a `userId` filter would compute totals across all users in the database. A `COUNT(*)` on `entries` without `WHERE userId = ...` would count every entry ever created, not just the requesting user's entries. The data breach would be silent — the response would look valid but contain every user's data mixed together.

**Q: What is the lookup-then-check pattern and why use it instead of filtering by both `id` and `userId` in the query?**

> The pattern is: fetch by unique ID using `findUnique`, check existence, then call `assertOwnership`. The alternative is `findFirst({ where: { id, userId } })`. The pattern in this repo uses `findUnique` (which uses the primary key index directly and is faster than `findFirst`) and makes the ownership check explicit via a named function call, reducing the chance of accidentally omitting it when writing new service methods.
