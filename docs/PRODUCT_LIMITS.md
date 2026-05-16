# Product Limits and Scenarios

This document finalises all product limit decisions and edge case behaviours before implementing Phase 7 (CategoriesModule) and Phase 8 (EntriesModule). Decisions here directly shape service-layer business logic and the migration added at the start of Step 21.

Every item still open is marked **[OPEN DECISION]** and must be resolved before the relevant step begins. Everything else is finalised.

---

## 1. Plan Tier Summary

| Limit | Free | Pro |
|---|---|---|
| Active categories per user | **3** | **Unlimited** |
| Active subcategories per category | **5** | **Unlimited** |
| Completed categories | **Unlimited** | **Unlimited** |
| Completed subcategories | **Unlimited** | **Unlimited** |
| Entries per day (by entry date) | **10** | **Unlimited** |
| Entry text length | 1 000 chars | 1 000 chars |
| AI weekly summary | No (feature flag) | Yes |
| GitHub / Jira integration | No (feature flag) | Yes |
| Resume / performance export | No (feature flag) | Yes |
| Public profile | No (feature flag) | Yes |
| Concurrent sessions | Unlimited | Unlimited |
| Historical data retention | Indefinite | Indefinite |

**Key principle:** tier limits apply to *active* categories and subcategories only. Completed items do not count toward any limit. This allows free users to naturally cycle through focus areas over time without being blocked by historical data.

---

## 2. Category Limits

### Free tier: 3 active categories

**Reasoning:** With completion available, 3 simultaneous active categories is a genuine but fair constraint. Users can cycle through focus areas over time — completing "Job Search 2024" to make room for a new area — so the ceiling is never a permanent block on growth. The active limit and the onboarding minimum are intentionally different numbers (see below).

**Onboarding minimum: 1 category, subcategory optional.**

Onboarding only requires the user to create one category before they can start logging. Subcategories are optional throughout. The 3-active limit is a *ceiling* users grow into naturally after onboarding, not a floor they must reach before using the product. Separating these numbers reduces onboarding friction and gets users to their first log entry faster.

**Enforcement:**

```sql
SELECT COUNT(*) FROM categories
WHERE user_id = :userId AND is_completed = false
```

If count >= 3 (free user), throw `422 UnprocessableEntityException`:
> "Free plan allows a maximum of 3 active categories. Complete an existing category or upgrade to Pro to create more."

**Pro tier:** Unlimited. No cap checked.

---

## 3. Subcategory Limits

### Free tier: 5 active subcategories per category

The limit applies per category, not globally. A user can have 5 active subcategories in one category and 2 in another — the counts are independent. Completed subcategories within a category do not count toward that category's limit.

**Enforcement:**

```sql
SELECT COUNT(*) FROM subcategories
WHERE category_id = :categoryId AND is_completed = false
```

If count >= 5 (free user), throw `422 UnprocessableEntityException`:
> "Free plan allows a maximum of 5 active subcategories per category. Complete an existing subcategory or upgrade to Pro to create more."

**Pro tier:** Unlimited.

---

## 4. Daily Entry Limit

### Free tier: 10 entries per day (counted by entry_date)

**Why entry_date, not created_at?**

Users regularly log yesterday's work today — this is a core product use case. Counting by `created_at` penalises users who batch-log in the morning for the previous day. Counting by `entry_date` is semantically correct: "on day X, you may log at most 10 things that happened on day X."

**Why 10?**

On a typical active day a developer logs 3–5 entries. 10 is generous enough that normal usage never hits the limit, but tight enough that power users — the ones most likely to pay — feel genuine friction.

**The limit is global, not per-category.**

A user gets 10 entries per day across all their categories combined. Per-category limits would be confusing and artificially restrictive.

**Enforcement:**

```sql
SELECT COUNT(*) FROM entries
WHERE user_id = :userId AND entry_date = :entryDate
```

If count >= 10 (free user), throw `422 UnprocessableEntityException`:
> "You have reached the daily entry limit of 10 for [date]. Upgrade to Pro for unlimited entries."

**Edge cases:**
- A user who downgraded from Pro may have past days with more than 10 entries. Those are preserved. The limit only applies to new creation going forward.
- Deleting an entry for a given day frees a slot — the count drops and another entry for that day can be created.
- Editing an existing entry does not consume a slot (entry count is unchanged).

---

## 5. Future Entry Dates

**Decision: Block future dates.**

The product is a logging tool — it captures what already happened. Allowing future dates would undermine the product intent and create anomalies in analytics (entries for dates that have not yet occurred appearing in summaries).

**Rule:** `entry_date` must be <= today (server date in UTC). Validated in the service layer on both create and edit.

> **[OPEN DECISION]:** Confirm this. If forward-planning entries are desirable ("I plan to study this tomorrow"), future dates can be allowed with a visual indicator in the UI. Most growth-logging tools block them.

---

## 6. Category and Subcategory Lifecycle

### 6.1 The Core Rule: Complete vs Hard Delete

Categories and subcategories follow a single rule:

| State | Allowed action |
|---|---|
| Has entries (any, including via subcategories) | **Completion only** — hard delete is blocked |
| Has no entries | **Hard delete** is allowed (completion is also allowed if the user prefers to keep the name in history) |

This replaces the previous `ON DELETE RESTRICT` complexity entirely. A user never hits a confusing database error — the UI hides or disables the delete button when entries exist, and the API returns a clear message if called directly.

---

### 6.2 Schema Changes (Migration Added at Step 21)

Both `categories` and `subcategories` require a new column:

```sql
ALTER TABLE categories    ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE subcategories ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT false;
```

**Partial indexes for query performance:**

```sql
CREATE INDEX idx_categories_user_id_active
  ON categories (user_id)
  WHERE is_completed = false;

CREATE INDEX idx_subcategories_category_id_active
  ON subcategories (category_id)
  WHERE is_completed = false;
```

**Why `BOOLEAN` over a string enum?**

The two-state model (active / completed) is exactly what a boolean is for. `BOOLEAN` is 1 byte per row. The partial indexes above contain only active rows — they are smaller, faster to scan, and cover the dominant query pattern (fetch active items for a user). A string enum offers no query performance benefit for two states and adds migration overhead (PostgreSQL enum types are painful to alter).

**Prisma model additions:**

```prisma
model Category {
  // existing fields ...
  isCompleted Boolean @default(false)
}

model Subcategory {
  // existing fields ...
  isCompleted Boolean @default(false)
}
```

---

### 6.3 Completing a Category

**What completion does:**
- Sets `is_completed = true` on the category row.
- The category and all its subcategories remain fully visible in the UI and in analytics.
- All existing entries are preserved and remain editable (text, date, type, productivity score can all be changed on existing entries — completion restricts forward activity, not historical corrections).

**What is blocked after completion:**
- Creating new entries assigned to this category (or any of its subcategories)
- Renaming the category
- Changing the category colour
- Adding new subcategories
- Reactivating individual subcategories while the parent is still completed (must reactivate the parent first)

**Subcategory `is_completed` state when a category is completed:**
- Individual subcategory flags are NOT touched — they retain their current value.
- However, since the parent is completed, all its subcategories are implicitly frozen regardless of their own flag.
- The service enforces this by checking `category.is_completed = false` on every entry create/edit, in addition to checking the subcategory.

**Entry creation guard:**

Before creating or reassigning an entry, the service checks:
```sql
SELECT is_completed FROM categories WHERE id = :categoryId AND user_id = :userId
```
If `is_completed = true`, throw `422`:
> "Cannot add entries to a completed category. Reactivate it to continue logging."

**Analytics behaviour:** Entries from completed categories are included in all analytics queries by default. The summary endpoint returns completed categories in the breakdown, marked with their completed state so the frontend can render them distinctly (e.g. greyed out with a tick icon).

**API:** `PATCH /categories/:id` — accepts `{ isCompleted: true }` alongside the existing `{ name }` field. Both fields are optional; either or both can be sent in one request.

---

### 6.4 Completing a Subcategory (Parent Still Active)

**What completion does:**
- Sets `is_completed = true` on the subcategory row only.
- The parent category remains active and unaffected.
- Existing entries that reference this subcategory retain the reference — they are not cleared. The completed subcategory still appears in those entries' detail views and in analytics.
- The subcategory no longer appears in the "available subcategories" dropdown when creating or editing a new entry.

**What is blocked after completion:**
- Assigning this subcategory to any new entry
- Assigning this subcategory to an existing entry via edit (cannot add a completed subcategory to a previously untagged entry)
- Renaming the subcategory

**What remains allowed:**
- Viewing entries that already had this subcategory
- Editing those entries' other fields (text, date, type, score)
- Reactivating the subcategory (if parent is active and within free tier limit)

**Subcategory assignment guard:**

```sql
SELECT is_completed FROM subcategories WHERE id = :subcategoryId
```
If `is_completed = true`, throw `422`:
> "Cannot assign entries to a completed subcategory. Reactivate it to use it again."

**API:** `PATCH /categories/:id/subcategories/:subId` — accepts `{ isCompleted: true }`.

---

### 6.5 Reactivating a Category

Reactivation sets `is_completed = false`, returning the category to full active state.

**Conditions that must pass before reactivation:**
1. The user's current active category count must be below the tier limit.
   - Free user at 5 active categories trying to reactivate a completed one: `422`:
     > "Free plan allows a maximum of 5 active categories. Complete another category first or upgrade to Pro."
   - Pro user: no limit check.

**What reactivation does NOT do:**
- Does not change the `is_completed` state of subcategories. Each subcategory retains its own flag. A user who had completed a subcategory before completing the parent will find that subcategory still completed after the parent is reactivated — they must explicitly reactivate the subcategory separately if needed.

**API:** `PATCH /categories/:id` — accepts `{ isCompleted: false }`.

---

### 6.6 Reactivating a Subcategory

**Conditions that must pass:**
1. The parent category must be active (`is_completed = false`). Cannot reactivate a subcategory while its parent is still completed.
   - Error: `422`: "Cannot reactivate a subcategory while its parent category is completed. Reactivate '[Category Name]' first."
2. The active subcategory count for this category must be below the tier limit (free users).

**API:** `PATCH /categories/:id/subcategories/:subId` — accepts `{ isCompleted: false }`.

---

### 6.7 Hard Deleting a Category (Empty Only)

Hard delete is only reachable when a category has zero entries.

**Service check:**
```sql
SELECT COUNT(*) FROM entries WHERE category_id = :categoryId
```
- Count = 0: deletion proceeds. DB CASCADE deletes all subcategories (which also have zero entries). Response: `204 No Content`.
- Count > 0: `422`: "Cannot delete '[Category Name]' because it has entries. Mark it as complete instead."

**UI behaviour:** The delete button is hidden or disabled whenever the category has any entries. Completion is surfaced as the primary action instead. The API error is a safety net for direct API calls only.

**Confirmation prompt (empty category with subcategories):**
> "Deleting '[Category Name]' will also delete its [N] subcategories. This cannot be undone."

**API:** `DELETE /categories/:id` — unchanged endpoint, stricter service guard.

---

### 6.8 Hard Deleting a Subcategory (Empty Only)

Hard delete is only reachable when a subcategory has zero entries.

**Service check:**
```sql
SELECT COUNT(*) FROM entries WHERE subcategory_id = :subcategoryId
```
- Count = 0: deletion proceeds. Response: `204 No Content`.
- Count > 0: `422`: "Cannot delete '[Subcategory Name]' because it has entries. Mark it as complete instead."

**Note on SET NULL:** The database still enforces `ON DELETE SET NULL` on `entries.subcategory_id` as a structural safety net for direct DB operations. The application layer never reaches that code path through normal usage because the service blocks deletion when entries exist.

**API:** `DELETE /categories/:id/subcategories/:subId` — unchanged endpoint, stricter service guard.

---

### 6.9 Deleting an Entry

- Hard delete. Permanent at MVP. No recovery.
- Entries are leaf nodes — no cascading effects on any other table.
- Analytics and summaries reflect the deletion immediately on next query (computed at query time, not pre-computed).
- Response: `204 No Content`.

**UI confirmation prompt:**
> "Delete this entry? This cannot be undone."

**Effect on daily limit:** Deleting an entry frees a slot for that day. A free user with 10 entries on a given day who deletes one can create a replacement.

---

### 6.10 Deleting a User Account

Deferred from MVP. Not in the current API contract.

When implemented: all user data cascades (categories, subcategories, entries, refresh tokens) via FK CASCADE. UI should offer a data export step before confirming. Deletion is immediate and permanent.

---

## 7. Rename Scenarios

### 7.1 Renaming a Category

- Only allowed when the category is **active** (`is_completed = false`).
- Attempting to rename a completed category: `422`: "Cannot rename a completed category. Reactivate it first."
- All entries reference the category by UUID — the name change is reflected everywhere immediately without touching any entry rows.
- If the new name already exists for this user: `409 Conflict` (uniqueness constraint: `(user_id, name)`).
- Response on success: `200 OK` with the updated category.

### 7.2 Renaming a Subcategory

- Only allowed when the subcategory is **active** (`is_completed = false`).
- Attempting to rename a completed subcategory: `422`: "Cannot rename a completed subcategory. Reactivate it first."
- Uniqueness constraint is `(category_id, name)`. Two subcategories in different parent categories can share a name — this is valid.
- Response on success: `200 OK` with the updated subcategory.

---

## 8. Entry Reassignment (Changing Category or Subcategory on Edit)

When a user edits an entry and changes its category or subcategory:

**Changing `category_id`:**
- The new category must be owned by the authenticated user.
- The new category must be **active** (`is_completed = false`). Assigning an entry to a completed category is not allowed, even on edit: `422`: "Cannot reassign an entry to a completed category."
- If the entry has a `subcategory_id` that belongs to the old category, it must be cleared. Service rule: if `categoryId` changes and `subcategoryId` is present, verify the subcategory belongs to the new category. If not, set `subcategoryId = null` automatically.

**Changing `subcategory_id`:**
- The new subcategory must belong to the entry's current `categoryId`.
- The new subcategory must be **active** (`is_completed = false`): `422`: "Cannot assign entries to a completed subcategory."
- Subcategory that belongs to a different parent category: `422`: "Subcategory does not belong to the selected category."

**Setting `subcategory_id` to null:**
- Always allowed. Removes the subcategory tag from the entry.

---

## 9. Subscription Lifecycle

### 9.1 Free → Pro Upgrade

- `subscription_status` changes: `FREE` → `ACTIVE`
- `subscription_plan` set (e.g. `'pro_monthly'`, `'pro_yearly'`)
- `stripe_customer_id` populated on first Stripe interaction
- Effective immediately on Stripe webhook confirmation
- All free tier limits are lifted immediately — no data migration needed

### 9.2 Pro → Cancellation

- `subscription_status` changes: `ACTIVE` → `CANCELLED`
- User retains Pro access until end of the paid billing period
- When period expires → `subscription_status: FREE` via Stripe webhook
- Free tier limits apply to new creation only from that point
- **No data is ever deleted on downgrade.**

### 9.3 Downgrade Behaviour: Data Over the Free Tier Limits

| Scenario | Behaviour |
|---|---|
| Has 8 active categories (free limit: 3) | All 8 remain accessible. Cannot create new categories. To make room, user must complete or delete categories until active count < 3. |
| Has active category with 7 active subcategories (free limit: 5) | All 7 remain accessible. Cannot add more to that category. Must complete or delete 2 to make room. |
| Has historical days with > 10 entries | All historical entries intact. The 10/day limit applies only to new entry creation going forward. |
| Has completed categories | Completed categories never count toward the limit — no action needed on downgrade. |

### 9.4 Payment Failure (PAST_DUE)

- `subscription_status` changes: `ACTIVE` → `PAST_DUE`
- Grace period: 7 days (recommended Stripe configuration)
- During grace period: Pro access maintained, in-app banner prompts payment update
- Grace period expired: `subscription_status` → `FREE`
- Same rules as section 9.3 apply

---

## 10. Field-Level Constraints (Consolidated Reference)

| Field | Rule | Enforcement |
|---|---|---|
| Entry text | Min 10 chars, max 1 000 chars | Zod (app) |
| Entry type | `WORK` or `LEARNING` only | Zod + DB enum |
| Productivity score | Integer 1–10, optional | DB check constraint + Zod |
| `entry_date` | Must be today or in the past | Service layer |
| Category name | Max 100 chars, unique per user (active + completed) | DB + Zod |
| Subcategory name | Max 100 chars, unique per parent category (active + completed) | DB + Zod |
| `is_completed` | Boolean, default false | DB + service |
| Password | Min 8 chars, 1 number, 1 special character | Zod |
| Email | Valid format, unique globally | DB + Zod |

**Note on name uniqueness:** The uniqueness constraints `(user_id, name)` on categories and `(category_id, name)` on subcategories apply across both active and completed items. A user cannot create an active category named "Python" if they already have a completed category with that name. This prevents confusion when items are reactivated.

---

## 11. Open Decisions

| # | Question | Recommendation | Required by |
|---|---|---|---|
| 1 | Allow future entry dates? | **No — entry_date must be ≤ today** | Step 23 |
| 2 | Should analytics exclude completed categories when a filter is applied? | **No filter at MVP — always include completed** | Step 24 |
| 3 | Account deletion: MVP or deferred? | **Deferred** | — |
| 4 | Max all-time entries per user? | **No limit** | — |
