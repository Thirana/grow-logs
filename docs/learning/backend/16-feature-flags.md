# 16 — Feature Flags

**Phase:** Phase 9 (Step 25) | **Concepts:** Feature flags, database-backed flags, in-memory caching, cache TTL, cache invalidation, OnModuleInit, the Map data structure as a cache, flag-gated services

---

## What a Feature Flag Is

A feature flag (also called a feature toggle) is a boolean value stored outside your application code that controls whether a specific feature is active. When the flag is `false`, the feature is disabled — the code for it exists in the deployed binary but is never reached. When the flag is `true`, the feature is enabled.

The alternative to feature flags is branching deployments: you only merge and deploy code when you are ready to release it. Feature flags decouple deployment from release. You can deploy code anytime, leave the flag off, and flip it on when you are ready — no redeployment required.

---

## Why Feature Flags Exist in Grow Logs

Grow Logs has several non-MVP features planned: AI-generated weekly summaries, GitHub integration, Stripe billing, public profiles, and resume export. These features are not built yet, but the architecture anticipates them.

Feature flags let the team ship an MVP with none of those features active while the infrastructure is already in place to gate them. When a feature is built, the code is deployed with its flag still `false`. The flag is flipped only after the feature has been tested. If something goes wrong, the flag is flipped back without a redeployment — no hotfix commit, no CI pipeline, no waiting.

The six flags in Grow Logs:

| Flag key | Controls |
|---|---|
| `ai_weekly_summary` | AI-generated weekly digest email |
| `github_integration` | GitHub commit and PR auto-import |
| `jira_integration` | Jira ticket auto-import |
| `stripe_billing` | Stripe subscription billing |
| `public_profile` | Shareable public learning profile |
| `resume_export` | PDF resume and performance review export |

All default to `false`. None are activated until explicitly instructed.

---

## Storing Flags in a Database Table

Flags could be stored as environment variables, in a config file, or in a third-party service (LaunchDarkly, Unleash). Grow Logs uses a database table. The `feature_flags` table has a row per flag:

```sql
CREATE TABLE "feature_flags" (
    "id"          TEXT    NOT NULL,
    "key"         TEXT    NOT NULL,     -- 'stripe_billing', 'ai_weekly_summary', etc.
    "enabled"     BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT    NOT NULL,     -- internal documentation for the admin
    "createdAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP NOT NULL,
    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feature_flags_key_key" UNIQUE ("key")
);
```

The `key` column has a unique constraint — no two rows can share a key. An admin flips a flag by updating the `enabled` boolean on the relevant row. The next time the application reads the flag (within the cache TTL), it picks up the new value.

**Why a database table over environment variables?**

Environment variables are set at container startup. Changing one requires restarting the container (a redeployment). A database row can be updated at any time and the running application reads the new value on the next cache miss — no restart, no redeployment.

**Why a database table over a third-party service like LaunchDarkly?**

Third-party flag services add cost, a network dependency, and operational complexity. At MVP scale with six static flags that change infrequently and manually, a database table is sufficient. The `FeatureFlagsService` is designed so the implementation can be swapped out later without changing any of the calling code.

---

## The In-Memory Cache: Why It Exists

Without a cache, every call to `getAll()` or `isEnabled()` would hit the database. Feature flags are checked on every request that involves a gated feature. If the AI summary scheduler checks `isEnabled('ai_weekly_summary')` before every job run, that is a database query per run. If the billing middleware checks `isEnabled('stripe_billing')` on every request, that is a database query per request.

Flags change infrequently — manually, by an admin, through the admin panel. Reading a flag that was last changed three months ago does not need to hit the database. An in-memory cache eliminates these unnecessary round-trips.

---

## How the Cache Works: TTL

The cache has a **time-to-live (TTL)** of 60 seconds. This means:

- The first call loads flags from the database and stores them in memory
- For the next 60 seconds, all calls return the in-memory values — no database query
- After 60 seconds, the next call triggers a fresh database read
- The refreshed values are stored and the 60-second window starts again

```typescript
// feature-flags.service.ts
private cache: Map<string, boolean> = new Map();
private cacheExpiresAt = 0;                         // 0 means expired on startup
private readonly CACHE_TTL_MS = 60_000;             // 60 seconds

async getAll(): Promise<FlagItem[]> {
  if (Date.now() < this.cacheExpiresAt) {
    // Cache is still fresh — return in-memory values
    return Array.from(this.cache.entries()).map(([key, enabled]) => ({ key, enabled }));
  }
  // Cache is stale — refresh from database
  await this.refreshCache();
  return Array.from(this.cache.entries()).map(([key, enabled]) => ({ key, enabled }));
}
```

`cacheExpiresAt` starts at `0`. `Date.now()` always returns a positive number (milliseconds since epoch, currently in the trillions), so the first call always falls through to `refreshCache()`. After refreshing, `cacheExpiresAt` is set 60 seconds into the future.

---

## The Map as a Cache

A JavaScript `Map` is a key-value store. In `FeatureFlagsService`, the keys are flag strings (`'stripe_billing'`) and the values are booleans (`false`). It is the in-memory cache:

```typescript
private cache: Map<string, boolean> = new Map();
```

After each database refresh, the Map is cleared and repopulated:

```typescript
async refreshCache(): Promise<void> {
  const flags = await this.prisma.featureFlag.findMany();
  this.cache.clear();                                     // wipe stale values
  flags.forEach((f) => this.cache.set(f.key, f.enabled)); // populate with fresh values
  this.cacheExpiresAt = Date.now() + this.CACHE_TTL_MS;   // set expiry 60s from now
}
```

`this.cache.clear()` removes every entry. The `forEach` loop adds the current database rows back. By clearing before repopulating, you avoid a scenario where a flag key has been deleted from the database but still exists in the Map from a previous load.

**Why `Map` over a plain object?**

A plain JavaScript object (`{}`) could also store key-value pairs. `Map` is preferred because:
- It has a built-in `clear()` method
- It is purpose-built for dynamic key-value storage where keys are added and removed programmatically
- `Map` preserves insertion order, which is useful for consistent response ordering
- TypeScript types are more specific: `Map<string, boolean>` makes the intent explicit

Reading from the cache is O(1) — `Map.get()` is a hash lookup, not an array scan.

---

## Warming the Cache on Startup

The service implements NestJS's `OnModuleInit` lifecycle hook. `onModuleInit()` is called by the NestJS module system after all dependencies are injected and before the application starts serving requests:

```typescript
// feature-flags.service.ts
async onModuleInit(): Promise<void> {
  await this.refreshCache();
}
```

Without this, the first request to any flag-gated feature would trigger a database query (the cold cache path). With it, the flags are already loaded and the cache is warm from the moment the application is ready to handle traffic.

**NestJS module lifecycle:**

```
1. Module compiled (providers instantiated, dependencies injected)
2. onModuleInit() called on each provider that implements OnModuleInit
3. Application starts listening for requests
```

The application never serves a request before `onModuleInit()` completes. This guarantees that when the first request arrives, the cache is already populated.

---

## Cache Invalidation: `refreshCache()` as a Public Method

The 60-second TTL means a flag change can take up to 60 seconds to propagate to the running application. For most situations this is acceptable — flags change manually and infrequently.

But when an admin explicitly flips a flag through the admin panel, they would reasonably expect the change to take effect immediately, not after an unknown delay of up to a minute.

`refreshCache()` is therefore a `public` method (not `private`). `AdminService` in Step 26 will call it immediately after a flag toggle:

```typescript
// admin.service.ts (Step 26)
async toggleFlag(key: string, enabled: boolean): Promise<void> {
  await this.prisma.featureFlag.update({
    where: { key },
    data: { enabled },
  });
  // Immediately invalidate the cache so the new value is visible at once
  await this.featureFlagsService.refreshCache();
}
```

After the database update, `refreshCache()` reloads all flags from the database and resets the TTL timer. The next call to `getAll()` or `isEnabled()` will return the updated value without waiting for the TTL to expire.

This is the standard pattern for TTL-based caching: TTL handles the common case (no changes), explicit invalidation handles the deliberate change case.

**Why is `FeatureFlagsModule` set to export `FeatureFlagsService`?**

```typescript
// feature-flags.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],           // ← AdminModule needs to inject this
})
export class FeatureFlagsModule {}
```

NestJS modules are isolated by default — one module's providers are not visible to others unless explicitly exported. `AdminModule` will import `FeatureFlagsModule` and inject `FeatureFlagsService` to call `refreshCache()`. Without the `exports` declaration, NestJS would throw an error saying the provider is not available in the importing module.

---

## The `isEnabled` Helper

Other services that need to check a flag do not call `getAll()` and search the array themselves. They call `isEnabled(key)`:

```typescript
// feature-flags.service.ts
async isEnabled(key: string): Promise<boolean> {
  const flags = await this.getAll();
  return flags.find((f) => f.key === key)?.enabled ?? false;
}
```

The `?? false` is important: if the key does not exist in the flags array (perhaps a flag was accidentally deleted from the database, or a typo was made in the key), `isEnabled` returns `false` rather than throwing or returning `undefined`. Unknown flags default to disabled — the safe direction. A missing flag should never accidentally activate a feature.

A future service using this pattern:

```typescript
// hypothetical ai-summary.service.ts
constructor(private readonly featureFlagsService: FeatureFlagsService) {}

async generateWeeklySummary(userId: string): Promise<void> {
  if (!await this.featureFlagsService.isEnabled('ai_weekly_summary')) {
    return;  // feature is off — do nothing
  }
  // proceed with AI summary generation
}
```

The flag check is a single line. The service does not know or care how flags are stored or cached — that is entirely `FeatureFlagsService`'s responsibility.

---

## What the Response Looks Like

The `GET /v1/feature-flags` endpoint returns only `key` and `enabled`. The `description` field (which exists in the database for admin documentation purposes) is deliberately excluded:

```json
{
  "data": [
    { "key": "ai_weekly_summary", "enabled": false },
    { "key": "github_integration", "enabled": false },
    { "key": "jira_integration", "enabled": false },
    { "key": "stripe_billing", "enabled": false },
    { "key": "public_profile", "enabled": false },
    { "key": "resume_export", "enabled": false }
  ],
  "meta": {}
}
```

The frontend reads this on load and uses it to conditionally show or hide UI elements. The `FlagItem` type enforces the shape:

```typescript
export type FlagItem = { key: string; enabled: boolean };
```

The `description` is internal — it documents what a flag controls for the person who will toggle it in the admin panel. Sending it to the frontend would expose internal implementation details unnecessarily.

---

## Why In-Memory Cache and Not Redis

Redis is an external, distributed cache. Every application instance (ECS task) queries Redis instead of the database. One cache is shared across all instances — a flag update is immediately visible to all servers.

In-memory cache lives inside each application process. If there are three ECS tasks running, each has its own in-memory cache. A flag toggle invalidates the cache on the task that processed the admin request. The other two tasks refresh their caches within 60 seconds as their TTL expires.

For Grow Logs at MVP stage:
- Flag changes are manual and infrequent — a 60-second propagation window across instances is acceptable
- Redis adds infrastructure cost (managed Redis cluster on AWS ElastiCache), operational complexity, and a network dependency
- At tens-of-instances scale, in-memory cache is sufficient
- The `refreshCache()` API is designed so the implementation can be swapped to Redis later without changing any calling code — the interface stays the same

This is a good example of YAGNI (You Aren't Gonna Need It): adding Redis now would solve a problem that does not exist at the current scale.

---

## Interview Summary

**Q: What is a feature flag and why would you use one?**

> A feature flag is a boolean value stored outside your code that controls whether a feature is active. You use it to decouple deployment from release — code can be deployed with its flag off, and the feature is enabled only when ready by flipping the flag. It also enables instant rollback without redeployment: if something is wrong, flip the flag back.

**Q: Why store feature flags in a database instead of environment variables?**

> Environment variables are set at container startup and require a restart to change. A database row can be updated at any time and the running application picks up the new value on the next cache miss — no restart or redeployment required. This makes flag management much faster and lower-risk.

**Q: Why cache feature flags at all? Why not query the database every time?**

> Flags are checked on every flag-gated request but change infrequently — maybe once a month. Querying the database on every request for a value that almost never changes wastes database connections and adds latency. An in-memory cache serves the cached value in nanoseconds and only hits the database once per TTL window.

**Q: What happens when a cache TTL expires?**

> The next call to `getAll()` finds that `Date.now()` is past `cacheExpiresAt`. It calls `refreshCache()`, which fetches fresh values from the database, clears the Map, repopulates it, and sets a new `cacheExpiresAt` 60 seconds in the future. Subsequent calls within the new window return the in-memory values again.

**Q: Why does `isEnabled` return `false` for unknown keys instead of throwing?**

> Unknown flag keys should default to the safe direction — disabled. If a key is misspelled or a flag is accidentally deleted, returning `false` means the feature stays off. Throwing would crash the service that checked the flag. Returning `undefined` (which happens naturally from `.find()`) would require every caller to handle nullability. The `?? false` fallback keeps the API clean and failure-safe.

**Q: What is `OnModuleInit` and why does `FeatureFlagsService` implement it?**

> `OnModuleInit` is a NestJS lifecycle interface. The `onModuleInit()` method is called after all providers are instantiated but before the application starts handling requests. Implementing it in `FeatureFlagsService` warms the cache on startup, so the first request to a flag-gated feature reads from the in-memory cache rather than triggering a cold database query.
