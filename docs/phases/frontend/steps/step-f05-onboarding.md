# Step F05 — Onboarding Flow

**Phase:** 2  
**Status:** ⬜ Not started  
**Depends on:** F04 (route protection in place)

---

## Goal

First-time users complete a guided two-step wizard before reaching the dashboard. They must create at least one category (subcategory is optional). On completion, `POST /onboarding/complete` is called.

**Limit reference (from `docs/PRODUCT_LIMITS.md`):**
- Onboarding minimum: 1 category
- Subcategory: optional
- Free tier max: 3 active categories — this ceiling does not apply during onboarding because the user starts with 0

---

## What to Build

### Route Group: `app/(onboarding)/`

**`app/(onboarding)/layout.tsx`**

Simple centered layout. No sidebar, no top bar. Progress indicator at the top: "Step 1 of 2" / "Step 2 of 2".

Add an onboarding guard: if `useAuthStore().user?.onboardingCompleted === true`, redirect to `/dashboard`. This prevents completed users from re-entering the wizard.

**`app/(onboarding)/onboarding/page.tsx`**

`'use client'` component that manages the step state (`useState<1 | 2>`).

Renders `OnboardingStep1` or `OnboardingStep2` based on current step.

### Component: `components/onboarding/onboarding-step1.tsx`

**UI:**
- Heading: "Create your first category"
- Sub-heading: "Categories organise your log entries. You can add more later."
- Input: category name (max 50 chars, same as `createCategorySchema`)
- "Add" button or Enter key press — creates the category via `useCreateCategory()` and adds it to a local list
- Created categories shown as chips/tags below the input, each with an × button
- Removing a chip calls `useDeleteCategory(id)`
- "Continue" button: enabled only when at least one category chip exists; disabled otherwise
- Optional section (below categories): "Add a subcategory (optional)" — small text input + "Add" button. Subcategory is added under the most recently created category using `useCreateSubcategory()`. If the user has no categories yet, this section is hidden.
- On "Continue": move to step 2

**Note on live API calls:** Categories are created immediately when the user clicks "Add" — not deferred. If the user removes a chip, `DELETE /categories/:id` is called immediately. This is intentional: it keeps the wizard stateless (no local-only state to sync later) and avoids needing a "save" step.

### Component: `components/onboarding/onboarding-step2.tsx`

**UI:**
- Heading: "You're all set!"
- Summary: "You created [N] categor[y/ies]. You're ready to start logging."
- "Go to dashboard" button — calls `useCompleteOnboarding()`, then on success redirects to `/dashboard`
- Button disabled + spinner while the mutation is in flight

### Hooks: `hooks/use-categories.ts`

Create the file with the hooks needed for onboarding (subset of the full categories hooks built in F11/F12):

```typescript
export function useCategories(): UseQueryResult<Category[], ApiError>
export function useCreateCategory(): UseMutationResult<Category, ApiError, CreateCategoryDto>
export function useDeleteCategory(): UseMutationResult<void, ApiError, string>
export function useCreateSubcategory(): UseMutationResult<Subcategory, ApiError, CreateSubcategoryArgs>
```

Query key for `useCategories`: `['categories']`

Both `useCreateCategory` and `useDeleteCategory` invalidate `['categories']` on success.

### Hook: `hooks/use-onboarding.ts`

```typescript
export function useCompleteOnboarding(): UseMutationResult<CompleteOnboardingResponse, ApiError, void>
```

On success:
1. Call `useAuthStore().setUser({ ...currentUser, onboardingCompleted: true })`
2. `router.replace('/dashboard')`

### Types: `packages/types/src/index.ts`

Add `Category` and `Subcategory`:

```typescript
export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  isCompleted: boolean;
  subcategories: Subcategory[];
  entryCount: number;
  createdAt: string;
}
```

### Schemas: `packages/schemas`

Check `packages/schemas/src/categories.ts`. If `createCategorySchema` does not exist, add:

```typescript
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
});
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const createSubcategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
});
export type CreateSubcategoryDto = z.infer<typeof createSubcategorySchema>;
```

Add them to `packages/schemas/src/index.ts` if not already exported.

---

## Files Created or Modified

| File | Action |
|---|---|
| `app/(onboarding)/layout.tsx` | Create |
| `app/(onboarding)/onboarding/page.tsx` | Create |
| `components/onboarding/onboarding-step1.tsx` | Create |
| `components/onboarding/onboarding-step2.tsx` | Create |
| `hooks/use-categories.ts` | Create |
| `hooks/use-onboarding.ts` | Create |
| `packages/types/src/index.ts` | Modify — add `Category`, `Subcategory` |
| `packages/schemas/src/categories.ts` | Modify if needed |
| `packages/schemas/src/index.ts` | Modify if needed |

---

## Done When

- [ ] New user who logs in with `onboardingCompleted: false` lands on `/onboarding`
- [ ] Step 1: user can type a category name and press Enter or click "Add" to create it
- [ ] Created category appears as a chip; removing the chip deletes the category via API
- [ ] The optional subcategory input is shown only after at least one category exists
- [ ] "Continue" button is disabled until at least one category chip exists
- [ ] Step 2: shows correct category count
- [ ] "Go to dashboard" calls `POST /onboarding/complete` and redirects to `/dashboard`
- [ ] After onboarding, revisiting `/onboarding` redirects to `/dashboard`
- [ ] Toast shown if create/delete category fails
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
