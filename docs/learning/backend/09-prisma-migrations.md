# 09 — Prisma Migrations

**Phase:** Phase 2 (Step 05) | **Concepts:** Database migrations, Prisma migration engine, shadow database, migration workflow, dev vs production commands, seeding

---

## What Are Database Migrations?

A migration is a versioned, sequential record of every change made to your database schema over time. Each migration is a SQL file that transforms the database from one state to the next.

Without migrations, schema changes are manual and undocumented — you run SQL directly against the database, nobody else knows what you ran, and there is no way to reproduce the exact database state in a new environment. With migrations, every change is tracked in version control alongside the code that depends on it.

The core guarantee migrations give you:

> Any database, in any environment, can be brought to the exact correct schema state by running the migration history in order from the beginning.

This is how a new developer joining the team, a fresh staging environment, and a production deployment all end up with identical schemas.

---

## How Prisma Migrations Work

Prisma migrations have three moving parts:

### 1. The Schema File (`schema.prisma`)
This is your source of truth. You describe what you *want* the database to look like — models, fields, indexes, relations, enums. You never write SQL by hand.

### 2. The Migration Files (`prisma/migrations/`)
Each migration is a folder with a timestamp name and a `migration.sql` file inside. Prisma generates this SQL by comparing your schema to the previous migration. You commit these files to git.

```
prisma/migrations/
  20260503140947_init/
    migration.sql          ← full initial schema as SQL
  20260512050550_add_refresh_tokens/
    migration.sql          ← only the changes (CREATE TABLE refresh_tokens...)
  migration_lock.toml      ← locks the database provider (postgresql)
```

### 3. The `_prisma_migrations` Table
Prisma creates this table in your database automatically. It records which migrations have been applied, when, and whether they succeeded. This is how Prisma knows what to run next.

```sql
-- What Prisma tracks internally:
SELECT migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
ORDER BY started_at;
```

---

## The Shadow Database

When you run `prisma migrate dev`, Prisma uses a **shadow database** — a temporary second database it creates and immediately destroys. Here is why:

Prisma needs to check that your migration history is consistent and can reproduce the current schema cleanly from scratch. It replays all your migrations against the shadow database, compares the result to your `schema.prisma`, and detects any drift (cases where someone changed the database directly without a migration).

The shadow database requires your database user to have permission to create databases. In development this is fine. In production, you use `migrate deploy` instead (explained below) which skips the shadow database entirely.

---

## Core Commands

### `prisma migrate dev`

**Use this in development only.**

```bash
npx prisma migrate dev --name <descriptive_name>
```

What it does, in order:
1. Creates the shadow database
2. Replays your entire migration history against it
3. Compares the result to your `schema.prisma`
4. Generates a new migration SQL file for any differences
5. Applies the new migration to your actual development database
6. Regenerates the Prisma Client (`@prisma/client`) so your TypeScript types stay in sync
7. Destroys the shadow database

If you run it with no schema changes, it just checks for drift and regenerates the client if needed.

```bash
# Good migration names — describe what changed, not a sequence number
npx prisma migrate dev --name add_refresh_tokens
npx prisma migrate dev --name add_soft_delete_to_entries
npx prisma migrate dev --name add_stripe_customer_id_to_users

# Bad migration names
npx prisma migrate dev --name migration_003
npx prisma migrate dev --name update
```

---

### `prisma migrate deploy`

**Use this in CI/CD and production only.**

```bash
npx prisma migrate deploy
```

What it does:
1. Looks at `_prisma_migrations` to find which migrations haven't been applied yet
2. Applies them in order
3. Does NOT use a shadow database
4. Does NOT generate new migrations
5. Does NOT regenerate the Prisma Client

This command is safe to run in production because it only applies already-reviewed, already-committed migration files. It never modifies your schema file or generates anything new.

In this repo, `migrate deploy` runs automatically as part of the CI/CD pipeline before the application starts.

---

### `prisma migrate status`

**Use this to inspect the current state of migrations.**

```bash
npx prisma migrate status
```

Output tells you:
- Which migrations have been applied
- Which migrations are pending (exist in the folder but haven't been applied to the database)
- Whether there is any drift between your migration history and the actual database

Useful when something looks wrong or when you want to confirm a deployment applied correctly.

---

### `prisma migrate reset`

**Use this in development only. Destructive.**

```bash
npx prisma migrate reset
```

What it does:
1. Drops the entire database
2. Recreates it
3. Replays all migrations from scratch
4. Runs the seed script if one is configured

Use this when your local database has gotten into a broken state — conflicting migrations, manual changes, or a corrupted `_prisma_migrations` table. Never run this against a staging or production database.

---

### `prisma db push`

**Avoid this in any project with a migration history.**

```bash
npx prisma db push   # ← do not use in this repo
```

`db push` syncs your schema directly to the database without creating a migration file. It is useful for quick prototyping before you have committed to a schema, but the moment you start using `migrate dev`, you should stop using `db push`. It creates schema changes with no migration record, causing drift that breaks `migrate dev` and `migrate deploy`.

---

### `prisma generate`

**Regenerates the TypeScript client from the current schema.**

```bash
npx prisma generate
```

`migrate dev` calls this automatically. You only need to run it manually if you pulled someone else's schema changes from git and need to update your local client without running a migration (e.g., a teammate added a new field and you need the TypeScript types to update).

---

### `prisma studio`

**Opens a visual browser-based database explorer.**

```bash
npx prisma studio
```

Opens at `http://localhost:5555`. You can browse all tables, view rows, and edit data. Useful for inspecting your local database during development without writing SQL.

---

## Command Reference Summary

| Command | Environment | What it does |
|---|---|---|
| `migrate dev --name <name>` | Development only | Generate + apply new migration, regenerate client |
| `migrate deploy` | CI/CD + Production | Apply pending migrations only, no generation |
| `migrate status` | Any | Show which migrations are applied / pending |
| `migrate reset` | Development only | Drop DB, replay all migrations, run seed |
| `db push` | Prototyping only | Sync schema without migration file — avoid in this repo |
| `generate` | Development | Regenerate TypeScript client from schema |
| `studio` | Development | Open visual DB browser at localhost:5555 |

---

## The Development Workflow

A typical schema change in this repo follows this sequence:

```
1. Edit schema.prisma
       │
       ▼
2. npx prisma migrate dev --name <descriptive_name>
       │
       ├── Prisma generates migration.sql
       ├── Applies it to local database
       └── Regenerates Prisma Client (TypeScript types update)
       │
       ▼
3. Commit both schema.prisma and the new migration folder to git
       │
       ▼
4. CI/CD pipeline runs npx prisma migrate deploy before app starts
       │
       ▼
5. Production database is updated automatically on deploy
```

The key discipline: **schema changes and their migrations are always committed together in the same commit.** If the migration file is missing, the next `migrate deploy` will fail.

---

## The Golden Rule: Never Edit Applied Migrations

Once a migration has been applied to any database (including your local dev database), treat it as read-only. Never edit the SQL inside it.

**Why:** Prisma checksums each migration file. If you edit a file after it has been applied, the checksum no longer matches what is stored in `_prisma_migrations`. The next `migrate dev` or `migrate deploy` will detect the mismatch and refuse to run with an error like:

```
Error: P3005
The database schema is not empty. Read more about how to baseline an existing production database
```

If you realise a migration was wrong, the fix is always a new migration that corrects it — never editing the old one.

---

## Seeding

Seeding is separate from migrations. Migrations handle schema structure; seeds handle initial data.

In this repo the seed script populates the `feature_flags` table with the six initial flags:

```bash
npx prisma db seed
```

The seed script is defined in `prisma/seed.ts` and referenced in `prisma.config.ts`:

```typescript
// prisma.config.ts
migrations: {
  path: 'prisma/migrations',
  seed: 'ts-node prisma/seed.ts',
},
```

`migrate reset` calls the seed script automatically after replaying migrations. `migrate dev` and `migrate deploy` do not run the seed — it is only for resetting to a known local state.

Seed data does not go into migration files because seed data can change without a schema change, and you do not want a migration that inserts rows to run against production (that data would already exist).

---

## How `prisma.config.ts` Works in This Repo

Prisma 6 introduced `prisma.config.ts` as a replacement for the `datasource` block in `schema.prisma`. This repo uses it to centralise configuration:

```typescript
// apps/api/prisma.config.ts
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
```

The `DATABASE_URL` is read from the environment. In development it comes from `.env`. In production it comes from AWS Secrets Manager via environment injection at container startup.

One consequence: when running Prisma commands locally, the `.env` file must be loaded. The working pattern is:

```bash
export $(cat .env | grep -v '^#' | xargs) && npx prisma migrate dev --name <name>
```

Or add a npm script in `package.json` that handles this automatically.

---

## Migration Naming Conventions in This Repo

Migration names describe the schema change, not a sequence number. Examples from this repo:

| Migration | What changed |
|---|---|
| `init` | Full initial schema — all tables, enums, indexes |
| `add_refresh_tokens` | Added the `refresh_tokens` table for token rotation |

Future examples following the same pattern:
- `add_soft_delete_to_entries`
- `add_stripe_webhook_events_table`
- `add_index_entries_category_id`
- `rename_subscription_plan_to_plan_name`

---

## What the Generated SQL Looks Like

Prisma generates standard PostgreSQL DDL. You can read and review it before applying. This is what the `add_refresh_tokens` migration produced:

```sql
-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

It is always worth reviewing the generated SQL before running it, especially for destructive operations (dropping columns, renaming tables) where Prisma may generate a drop + recreate rather than an ALTER.

---

## Interview Summary

**Q: What is a database migration and why do you need one?**

> A migration is a versioned SQL file that describes a schema change. You need them so that every environment — development, staging, production — can reach the exact same schema state by replaying the same sequence of changes. Without migrations, schema changes are manual, undocumented, and impossible to reproduce reliably.

**Q: What is the difference between `prisma migrate dev` and `prisma migrate deploy`?**

> `migrate dev` is for development — it generates new migration files, uses a shadow database to detect drift, and regenerates the TypeScript client. `migrate deploy` is for CI/CD and production — it only applies already-committed pending migrations in order, with no generation and no shadow database. You never run `migrate dev` in production.

**Q: What is a shadow database?**

> A temporary database that Prisma creates and destroys during `migrate dev`. Prisma replays your entire migration history against it to verify the migrations are consistent and that no one has modified the database directly without a migration. It requires database creation permissions, which is why it only runs in development.

**Q: Why should you never edit a migration file after it has been applied?**

> Prisma checksums every migration file. If you edit one after it has been applied, the checksum no longer matches what is stored in the `_prisma_migrations` table and Prisma will refuse to run further migrations. The correct fix is always a new migration that corrects the mistake.

**Q: What is the difference between migrations and seeding?**

> Migrations define schema structure — tables, columns, indexes, constraints. Seeds populate initial data. They are kept separate because seed data can change independently of the schema, and you do not want data-insertion statements running against production as part of a schema migration.
