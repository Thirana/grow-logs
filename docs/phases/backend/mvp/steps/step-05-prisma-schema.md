# Step 05 — Prisma Full Schema, Migrations, and Seeds

**Phase:** Phase 2 — NestJS Bootstrap + Prisma Schema
**Depends on:** Step 04 (NestJS app must exist and database must be running)

---

## What

Replace the minimal bootstrap Prisma schema with the full production schema for Grow Logs. Run the initial migration to create all five tables in the database. Seed the feature flags table with the six MVP flags, all disabled by default.

---

## Why

The schema is defined in full at this stage — before any business modules — because the database structure underpins every module that follows. Defining it piecemeal (one table per module phase) would require multiple migrations and risks inconsistencies in foreign key relationships that span modules.

Running the full migration now also validates that the schema is correct and the database is accessible before any business logic is written on top of it.

---

## Deliverables

**`prisma/schema.prisma`** — replace the minimal bootstrap schema with the full schema from `docs/SCHEMA.md`. This includes:
- Enums: `UserRole`, `SubscriptionStatus`, `EntryType`
- Tables: `users`, `categories`, `subcategories`, `entries`, `feature_flags`
- All indexes, unique constraints, check constraints, and foreign key `onDelete` behaviours exactly as specified in `docs/SCHEMA.md`

**Initial migration:**
```bash
npx prisma migrate dev --name init
```
This creates `prisma/migrations/[timestamp]_init/migration.sql`.

**`prisma/seed.ts`** — seed script that inserts the six feature flags with `enabled: false`:

| key | description |
|---|---|
| `ai_weekly_summary` | AI-generated weekly digest email |
| `github_integration` | GitHub commit and PR auto-import |
| `jira_integration` | Jira ticket auto-import |
| `stripe_billing` | Stripe subscription billing |
| `public_profile` | Shareable public learning profile |
| `resume_export` | PDF resume and performance review export |

Use `upsert` in the seed script so it is idempotent — running it twice does not create duplicates.

**`package.json` update:**
- Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` so `npx prisma db seed` runs the seed script
- Add `ts-node` as a dev dependency if not already present

**Run seed:**
```bash
npx prisma db seed
```

**Regenerate Prisma client:**
```bash
npx prisma generate
```

---

## Key Decisions

**One migration for the full schema, not one per table:** A single `init` migration is correct here because all tables are being created at the same time on a fresh database. Splitting into multiple migrations adds no value and creates a messy migration history before any code is even shipped.

**Seeds via `prisma/seed.ts`, not a migration:** Seeds are reference data that may change over time and may be re-run. Migrations are structural changes that are never re-run. Mixing them would make future seed data updates require a migration, which is wrong.

**`upsert` in seed:** The seed script may be run multiple times during development (e.g. after `db:reset`). Using `upsert` with the `key` field as the unique identifier makes it safe to run repeatedly.

**`onDelete: Restrict` on `categories → entries`:** This is intentional. The application layer must explicitly handle the case where a user tries to delete a category that has entries — show a warning and handle it in the service. The database constraint enforces this is never silently bypassed.

**`onDelete: SetNull` on `subcategories → entries`:** When a subcategory is deleted, entries that referenced it are not deleted — they retain their main category but lose the subcategory reference. This preserves user data.

---

## Done When

- `npx prisma migrate status` shows the `init` migration as applied
- `npx prisma studio` opens and shows all five tables with the correct columns
- `npx prisma db seed` runs without errors and inserts the six feature flags
- `GET /v1/health/ready` still returns 200 (confirms Prisma client can query the database)
- Running `npx prisma migrate dev` again shows "no pending migrations"
