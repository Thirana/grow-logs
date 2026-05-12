# Database Schema

## Design Principles

- All primary keys are UUIDs generated at the application level
- All tables have created_at and updated_at timestamps
- Hard deletes at MVP stage, soft delete added later via migration
- Business rules (category limits, score range) enforced at application level
- Structural integrity rules (uniqueness, foreign keys) enforced at database level
- All foreign keys have explicit ON DELETE behaviour defined
- user_id is denormalised onto subcategories for ownership checks without joins
- Entry text stored as plain markdown string in a TEXT column
- Composite unique constraints enforce per-user and per-category name uniqueness

---

## Enums

### UserRole

```
USER     -- Standard registered user
ADMIN    -- Platform administrator
```

### SubscriptionStatus

```
FREE         -- Default, no active paid plan
ACTIVE       -- Active paid subscription
CANCELLED    -- Subscription cancelled, access until period ends
PAST_DUE     -- Payment failed, grace period active
```

### EntryType

```
WORK       -- Work related log entry
LEARNING   -- Learning related log entry
```

---

## Tables

### users

| Column               | Type                     | Nullable | Default           | Notes                               |
| -------------------- | ------------------------ | -------- | ----------------- | ----------------------------------- |
| id                   | UUID                     | NO       | gen_random_uuid() | Primary key                         |
| email                | VARCHAR(255)             | NO       |                   | Lowercase enforced at app level     |
| password_hash        | VARCHAR(255)             | NO       |                   | bcrypt hash, never plain text       |
| role                 | UserRole                 | NO       | USER              |                                     |
| is_email_verified    | BOOLEAN                  | NO       | false             | Must be true before login permitted |
| onboarding_completed | BOOLEAN                  | NO       | false             | Drives post-login redirect logic    |
| subscription_status  | SubscriptionStatus       | NO       | FREE              |                                     |
| subscription_plan    | VARCHAR(50)              | YES      | NULL              | e.g. pro_monthly, pro_yearly        |
| stripe_customer_id   | VARCHAR(255)             | YES      | NULL              | Set on first Stripe interaction     |
| created_at           | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                     |
| updated_at           | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                     |

**Primary Key:** id

**Unique Constraints:**

- email
- stripe_customer_id

**Indexes:**

- idx_users_email (email)
- idx_users_stripe_customer_id (stripe_customer_id)

**Foreign Keys:** None. users is the root table.

---

### categories

| Column     | Type                     | Nullable | Default           | Notes                                    |
| ---------- | ------------------------ | -------- | ----------------- | ---------------------------------------- |
| id         | UUID                     | NO       | gen_random_uuid() | Primary key                              |
| user_id    | UUID                     | NO       |                   | FK to users                              |
| name       | VARCHAR(100)             | NO       |                   | Unique per user via composite constraint |
| created_at | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                          |
| updated_at | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                          |

**Primary Key:** id

**Unique Constraints:**

- (user_id, name) — same user cannot have two categories with the same name

**Indexes:**

- idx_categories_user_id (user_id)

**Foreign Keys:**

| Column  | References | On Delete |
| ------- | ---------- | --------- |
| user_id | users.id   | CASCADE   |

---

### subcategories

| Column      | Type                     | Nullable | Default           | Notes                                           |
| ----------- | ------------------------ | -------- | ----------------- | ----------------------------------------------- |
| id          | UUID                     | NO       | gen_random_uuid() | Primary key                                     |
| category_id | UUID                     | NO       |                   | FK to categories                                |
| user_id     | UUID                     | NO       |                   | Denormalised for ownership checks without joins |
| name        | VARCHAR(100)             | NO       |                   | Unique per category via composite constraint    |
| created_at  | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                                 |
| updated_at  | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                                 |

**Primary Key:** id

**Unique Constraints:**

- (category_id, name) — same category cannot have two subcategories with the same name

**Indexes:**

- idx_subcategories_category_id (category_id)
- idx_subcategories_user_id (user_id)

**Foreign Keys:**

| Column      | References    | On Delete |
| ----------- | ------------- | --------- |
| category_id | categories.id | CASCADE   |
| user_id     | users.id      | CASCADE   |

**Design note:** user_id is stored directly on subcategories even though it is reachable through category_id. This avoids a JOIN when verifying ownership of a subcategory on every mutating request.

---

### entries

| Column             | Type                     | Nullable | Default           | Notes                                                          |
| ------------------ | ------------------------ | -------- | ----------------- | -------------------------------------------------------------- |
| id                 | UUID                     | NO       | gen_random_uuid() | Primary key                                                    |
| user_id            | UUID                     | NO       |                   | FK to users                                                    |
| category_id        | UUID                     | NO       |                   | FK to categories                                               |
| subcategory_id     | UUID                     | YES      | NULL              | FK to subcategories, optional                                  |
| type               | EntryType                | NO       |                   | WORK or LEARNING                                               |
| text               | TEXT                     | NO       |                   | Markdown content. Min 10, max 1000 chars enforced at app level |
| productivity_score | SMALLINT                 | YES      | NULL              | 1 to 10. Enforced by check constraint and app validation       |
| entry_date         | DATE                     | NO       |                   | User-assigned date, not the system insert timestamp            |
| created_at         | TIMESTAMP WITH TIME ZONE | NO       | now()             | When the database record was inserted                          |
| updated_at         | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                                                |

**Primary Key:** id

**Check Constraints:**

- productivity_score >= 1 AND productivity_score <= 10

**Unique Constraints:** None

**Indexes:**

- idx_entries_user_id (user_id)
- idx_entries_user_id_entry_date (user_id, entry_date DESC)
- idx_entries_user_id_category_id (user_id, category_id)
- idx_entries_user_id_type (user_id, type)

**Foreign Keys:**

| Column         | References       | On Delete |
| -------------- | ---------------- | --------- |
| user_id        | users.id         | CASCADE   |
| category_id    | categories.id    | RESTRICT  |
| subcategory_id | subcategories.id | SET NULL  |

**ON DELETE RESTRICT on category_id:** Prevents deleting a category that has entries attached. The application layer warns the user and handles this explicitly before deletion proceeds.

**ON DELETE SET NULL on subcategory_id:** If a subcategory is deleted, entries that referenced it retain their category but lose the subcategory reference. They are not deleted.

**Design note on entry_date vs created_at:** entry_date is the date the user assigns to the entry — they may log yesterday's work today. All dashboard queries sort and filter by entry_date. created_at is the database insert timestamp used only for audit purposes.

---

### refresh_tokens

| Column     | Type                     | Nullable | Default           | Notes                                               |
| ---------- | ------------------------ | -------- | ----------------- | --------------------------------------------------- |
| id         | UUID                     | NO       | gen_random_uuid() | Primary key                                         |
| user_id    | UUID                     | NO       |                   | FK to users                                         |
| token_hash | VARCHAR(255)             | NO       |                   | bcrypt hash of the opaque token, never the raw value |
| expires_at | TIMESTAMP WITH TIME ZONE | NO       |                   | 7 days from issuance. Rolling — reset on every rotation |
| created_at | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                                     |

**Primary Key:** id

**Unique Constraints:**

- token_hash

**Indexes:**

- idx_refresh_tokens_user_id (user_id)
- idx_refresh_tokens_token_hash (token_hash)

**Foreign Keys:**

| Column  | References | On Delete |
| ------- | ---------- | --------- |
| user_id | users.id   | CASCADE   |

**Design note:** One row per active session. Rotation replaces the row (delete old, insert new). Reuse detection: if a lookup by token_hash finds nothing, the token was already rotated — the service then deletes all rows for that user_id (full session wipe) before returning 401. Logout deletes the single row for the current session.

---

### feature_flags

| Column      | Type                     | Nullable | Default           | Notes                                          |
| ----------- | ------------------------ | -------- | ----------------- | ---------------------------------------------- |
| id          | UUID                     | NO       | gen_random_uuid() | Primary key                                    |
| key         | VARCHAR(100)             | NO       |                   | Unique identifier used for lookups             |
| enabled     | BOOLEAN                  | NO       | false             | Master on/off switch                           |
| description | TEXT                     | YES      | NULL              | Internal explanation of what the flag controls |
| created_at  | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                                |
| updated_at  | TIMESTAMP WITH TIME ZONE | NO       | now()             |                                                |

**Primary Key:** id

**Unique Constraints:**

- key

**Indexes:**

- idx_feature_flags_key (key)

**Foreign Keys:** None. Feature flags are global, not user-scoped.

**Initial seed data:**

| key                | enabled | description                              |
| ------------------ | ------- | ---------------------------------------- |
| ai_weekly_summary  | false   | AI-generated weekly digest email         |
| github_integration | false   | GitHub commit and PR auto-import         |
| jira_integration   | false   | Jira ticket auto-import                  |
| stripe_billing     | false   | Stripe subscription billing              |
| public_profile     | false   | Shareable public learning profile        |
| resume_export      | false   | PDF resume and performance review export |

---

## Entity Relationship Summary

```
users
  |
  |--< categories (one user has many categories)
  |       |
  |       |--< subcategories (one category has many subcategories)
  |
  |--< subcategories (direct denormalised relationship)
  |
  |--< entries (one user has many entries)
  |       |
  |       |>-- categories (each entry belongs to one category, RESTRICT on delete)
  |       |
  |       |>-- subcategories (each entry optionally belongs to one subcategory, SET NULL on delete)
  |
  |--< refresh_tokens (one row per active session, CASCADE on user delete)

feature_flags (standalone, no relations)
```

---

## Complete Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum SubscriptionStatus {
  FREE
  ACTIVE
  CANCELLED
  PAST_DUE
}

enum EntryType {
  WORK
  LEARNING
}

model User {
  id                  String             @id @default(uuid())
  email               String             @unique
  passwordHash        String
  role                UserRole           @default(USER)
  isEmailVerified     Boolean            @default(false)
  onboardingCompleted Boolean            @default(false)
  subscriptionStatus  SubscriptionStatus @default(FREE)
  subscriptionPlan    String?
  stripeCustomerId    String?            @unique
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  categories     Category[]
  subcategories  Subcategory[]
  entries        Entry[]
  refreshTokens  RefreshToken[]

  @@index([email])
  @@index([stripeCustomerId])
  @@map("users")
}

model Category {
  id        String   @id @default(uuid())
  userId    String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subcategories Subcategory[]
  entries       Entry[]

  @@unique([userId, name])
  @@index([userId])
  @@map("categories")
}

model Subcategory {
  id         String   @id @default(uuid())
  categoryId String
  userId     String
  name       String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  entries  Entry[]

  @@unique([categoryId, name])
  @@index([categoryId])
  @@index([userId])
  @@map("subcategories")
}

model Entry {
  id                String    @id @default(uuid())
  userId            String
  categoryId        String
  subcategoryId     String?
  type              EntryType
  text              String
  productivityScore Int?
  entryDate         DateTime  @db.Date
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    Category     @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  subcategory Subcategory? @relation(fields: [subcategoryId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([userId, entryDate(sort: Desc)])
  @@index([userId, categoryId])
  @@index([userId, type])
  @@map("entries")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
  @@map("refresh_tokens")
}

model FeatureFlag {
  id          String   @id @default(uuid())
  key         String   @unique
  enabled     Boolean  @default(false)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([key])
  @@map("feature_flags")
}
```

---

## Migration Strategy

- Never edit migration files after they have been applied, even in development
- Every schema change gets its own migration with a descriptive name (e.g. add_soft_delete_to_entries)
- Migrations run automatically as part of the CI/CD pipeline before the application starts
- Feature flag seed data is handled in a separate Prisma seed script, not a migration
