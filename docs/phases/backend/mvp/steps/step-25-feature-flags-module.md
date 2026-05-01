# Step 25 — FeatureFlagsModule

**Phase:** Phase 9 — FeatureFlagsModule + AdminModule
**Depends on:** Step 13 (JwtAuthGuard), Step 05 (feature_flags table seeded)

---

## What

Implement the `FeatureFlagsModule` that reads feature flags from the database and returns them to the frontend. Results are cached in memory for 60 seconds to avoid a database query on every page load.

---

## Why

Feature flags let non-MVP features be deployed to production in a disabled state. The frontend reads the flag state on load and conditionally shows/hides UI for features like AI summaries, GitHub integration, and Stripe billing. This means new features can be developed and deployed without being visible to users until intentionally enabled.

The 60-second in-memory cache is a deliberate production pattern: without it, every frontend page load would hit the database for flag state. Flags change infrequently (manually by an admin); a 60-second stale window is acceptable.

---

## Deliverables

**`FeatureFlagsModule`** with `FeatureFlagsController` and `FeatureFlagsService`.

**`FeatureFlagsService`:**
```ts
@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  private cache: Map<string, boolean> = new Map();
  private cacheExpiresAt = 0;
  private readonly CACHE_TTL_MS = 60_000;

  async getAll(): Promise<Array<{ key: string; enabled: boolean }>> {
    if (Date.now() < this.cacheExpiresAt) {
      return Array.from(this.cache.entries()).map(([key, enabled]) => ({ key, enabled }));
    }
    await this.refreshCache();
    return Array.from(this.cache.entries()).map(([key, enabled]) => ({ key, enabled }));
  }

  async refreshCache(): Promise<void> {
    const flags = await this.prisma.featureFlag.findMany();
    this.cache.clear();
    flags.forEach((f) => this.cache.set(f.key, f.enabled));
    this.cacheExpiresAt = Date.now() + this.CACHE_TTL_MS;
  }

  async isEnabled(key: string): Promise<boolean> {
    const flags = await this.getAll();
    return flags.find((f) => f.key === key)?.enabled ?? false;
  }
}
```

`refreshCache()` is also called by `AdminService.toggleFlag()` in Step 26 to invalidate the cache immediately after a toggle.

**`GET /v1/feature-flags` controller endpoint:**
- Protected (requires `JwtAuthGuard` — flags are not public)
- Returns 200 with flags array
- Does NOT include the `description` field — that is for admin use only

**Response:**
```json
{
  "data": [
    { "key": "ai_weekly_summary", "enabled": false },
    { "key": "stripe_billing", "enabled": false }
  ],
  "meta": {}
}
```

---

## Key Decisions

**In-memory Map, not Redis:** Redis adds infrastructure overhead. At MVP scale (tens of servers max), a per-process in-memory cache is sufficient. All ECS task instances will independently refresh their cache within 60 seconds of a flag change — at most one minute of inconsistency across instances. This is acceptable for feature flags. Add Redis if consistency requirements tighten.

**`isEnabled(key)` helper method:** Other services in future modules (e.g. a weekly summary scheduler) can inject `FeatureFlagsService` and call `isEnabled('ai_weekly_summary')` to gate non-MVP logic. This keeps flag checks clean and centralised.

**`description` excluded from frontend response:** The `description` field is internal documentation for the admin. The frontend does not need it and it clutters the response.

---

## Done When

- `GET /v1/feature-flags` returns all six seeded flags with `enabled: false`
- A second request within 60 seconds does not produce a new database query (verified via query logging or a spy in tests)
- A request after 60 seconds produces a fresh database query
- `npm run test` passes
