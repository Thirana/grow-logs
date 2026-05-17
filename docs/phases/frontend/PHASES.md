# Frontend Implementation Phases

Fourteen steps across six phases. Each step is a single focused unit — one concern, one session.

## Step Index

| Step | Title | Phase | Status |
|---|---|---|---|
| [F01](steps/step-f01-auth-layout-register.md) | Auth Layout + Register + Check Email | Phase 1 | ✅ |
| [F02](steps/step-f02-login.md) | Login + Auth Store Wiring | Phase 1 | ✅ |
| [F03](steps/step-f03-verify-email.md) | Email Verification + Resend | Phase 1 | ✅ |
| [F04](steps/step-f04-middleware.md) | Route Protection Middleware | Phase 1 | ⬜ |
| [F05](steps/step-f05-onboarding.md) | Onboarding Flow | Phase 2 | ⬜ |
| [F06](steps/step-f06-dashboard-stats.md) | Dashboard Wired — Stats & Summary | Phase 3 | ⬜ |
| [F07](steps/step-f07-dashboard-entries.md) | Dashboard Wired — Entries List & Charts | Phase 3 | ⬜ |
| [F08](steps/step-f08-create-entry.md) | Create Entry | Phase 4 | ⬜ |
| [F09](steps/step-f09-edit-delete-entry.md) | Edit + Delete Entry | Phase 4 | ⬜ |
| [F10](steps/step-f10-categories-list.md) | Categories Page + List | Phase 5 | ⬜ |
| [F11](steps/step-f11-category-mutations.md) | Category Mutations | Phase 5 | ⬜ |
| [F12](steps/step-f12-subcategory-crud.md) | Subcategory CRUD | Phase 5 | ⬜ |
| [F13](steps/step-f13-profile-settings.md) | Profile + Update Email | Phase 6 | ⬜ |
| [F14](steps/step-f14-change-password.md) | Change Password | Phase 6 | ⬜ |

`⬜` not started · `✅` complete

---

## Dependency Map

```
Phase 1 (Auth — F01 → F02 → F03 → F04)
    └── Phase 2 (Onboarding — F05)
            └── Phase 3 (Dashboard — F06 → F07)
                    ├── Phase 4 (Entries — F08 → F09)
                    ├── Phase 5 (Categories — F10 → F11 → F12)
                    └── Phase 6 (Settings — F13 → F14)
```

Phases 4, 5, and 6 can run in parallel once Phase 3 is complete.

---

## What Already Exists

Before any step runs, the following is already in place:

| Thing | Location | Notes |
|---|---|---|
| Landing page | `app/page.tsx` + `components/landing/` | Complete — not touched by these steps |
| Dashboard UI components | `components/dashboard/` | Built on mock data — wired in F06/F07 |
| Auth Zustand store | `stores/auth.store.ts` | Updated in F02 to match real API response shape |
| Axios client + JWT interceptor + refresh logic | `lib/api.ts` | Complete |
| React Query provider | `providers/query-provider.tsx` | Complete |
| MSW mock handlers | `mocks/handlers/` | Complete — used in tests |
| Common UI components | `components/common/` | Complete |

---

## Product Limits That Affect the Frontend

These constraints from `docs/PRODUCT_LIMITS.md` must be reflected in UI behaviour — not just API error handling.

| Limit | Free tier value | UI implication |
|---|---|---|
| Active categories per user | 3 | Disable "add category" when `activeCategoryCount >= 3`; show upgrade prompt |
| Active subcategories per category | 5 | Disable "add subcategory" when that category's `activeSubcategoryCount >= 5` |
| Entries per day | 10 | Show user-friendly message on 422 daily limit error |
| Entry text | 10–1 000 chars | Character counter on entry form |
| Entry date | Must be ≤ today | Date picker capped at today |
| Category completion | Completed = no new entries, no rename, no new subcategories | UI hides or disables these actions when `isCompleted: true` |
| Subcategory completion | Completed = not shown in entry dropdowns, no rename | Filter from dropdowns; disable rename |
| Hard delete (category) | Only if 0 entries (else must complete) | Delete button disabled or hidden when entries exist; surface "Complete" as the action |
| Hard delete (subcategory) | Only if 0 entries (else must complete) | Same pattern as category |
| Onboarding minimum | 1 category (subcategory optional) | Enable "Continue" after first category is created |

---

## Phase 1 — Auth (F01–F04)

Register, log in, verify email, and protect routes. Four focused steps.

**Done when:** A user can go through the full auth lifecycle end-to-end in the browser.

---

## Phase 2 — Onboarding (F05)

First-time wizard requiring one category before the user reaches the dashboard.

**Done when:** New users land on onboarding after login and reach the dashboard only after creating at least one category.

---

## Phase 3 — Dashboard Wired (F06–F07)

Replace mock data with live API calls. Two steps: one for stats/summary, one for entries list and charts.

**Done when:** Dashboard shows real data. Mock data file deleted.

---

## Phase 4 — Entries CRUD (F08–F09)

Full create, edit, and delete for log entries. Two steps: create first, then edit/delete.

**Done when:** Users can create, edit, and delete entries from the dashboard.

---

## Phase 5 — Categories Management (F10–F12)

Full category and subcategory management including the active/completed lifecycle. Three focused steps.

**Done when:** Users can manage all categories and subcategories including completing and reactivating them.

---

## Phase 6 — User Settings (F13–F14)

Profile update and password change. Two focused steps.

**Done when:** Users can update their email and change their password from a settings page.
