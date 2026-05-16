# Step 20 — OnboardingModule

**Phase:** Phase 6 — UsersModule + OnboardingModule
**Depends on:** Step 19 (users module), Step 05 (categories table exists)

---

## What

Implement the single onboarding completion endpoint. When called, it verifies the user has set up at least 1 category, marks their account as onboarding-complete, and returns the updated status. This endpoint is what the frontend calls after the user finishes the category setup screen.

---

## Why

The `onboardingCompleted` flag drives the post-login redirect logic in the frontend: new users go to `/onboarding`, returning users go to `/dashboard`. Without this endpoint, the flag can never be set to `true` and users are stuck in the onboarding flow forever.

The 1-category minimum is a product decision — the onboarding flow is intentionally lightweight. Requiring only one category gets the user to their first log entry as fast as possible. Additional categories are created from the settings page after onboarding, up to their plan limit.

---

## Deliverables

**`OnboardingModule`** with `OnboardingController` and `OnboardingService`.

**`OnboardingService.complete(userId)`:**
1. Fetch the user's category count from the `categories` table (all categories, active and completed)
2. If count < 1, throw `BadRequestException` (400) with message: "You need at least 1 category to complete onboarding"
3. If `user.onboardingCompleted` is already `true`, throw `ConflictException` (409): "Onboarding already completed"
4. Set `onboardingCompleted: true` on the user record
5. Return `{ message: 'Onboarding completed.', onboardingCompleted: true }`

**`POST /v1/onboarding/complete` controller endpoint:**
- Protected (requires `JwtAuthGuard`)
- Empty request body `{}`
- Returns 200

**Response:**
```json
{
  "data": {
    "message": "Onboarding completed.",
    "onboardingCompleted": true
  },
  "meta": {}
}
```

---

## Key Decisions

**Check categories at completion time, not at category creation:** The 1-category minimum is enforced only when the user tries to complete onboarding. This gives users full freedom during the setup screen and avoids blocking them mid-flow if they delete a category they added by mistake.

**409 for already-completed:** This endpoint is idempotent in spirit (marking something complete twice should be safe) but the product decision is to surface a conflict because calling it a second time is probably a client-side bug. The frontend should check `onboardingCompleted` from the login response before calling this.

**Empty body `{}`:** The request body carries no data — this is a state transition, not a data creation. An empty POST body is correct.

---

## Done When

- `POST /v1/onboarding/complete` with a user who has ≥ 1 category sets `onboardingCompleted: true` and returns 200
- Same endpoint with 0 categories returns 400
- Same endpoint called twice returns 409 on the second call
- `GET /v1/users/me` after completion returns `onboardingCompleted: true`
- `npm run test` passes
