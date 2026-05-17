# Step F11 — Category Mutations

**Phase:** 5  
**Status:** ⬜ Not started  
**Depends on:** F10 (categories list page built)

---

## Goal

Full create, rename, complete, reactivate, and delete for categories. Every action respects the free tier limit of 3 active categories and the lifecycle rules from `docs/PRODUCT_LIMITS.md`.

---

## Product Rules (from `PRODUCT_LIMITS.md`)

- Free tier: max **3 active** categories per user
- **Completed categories do not count** toward the limit
- Cannot rename a completed category
- Cannot add entries to a completed category (enforced by the API; the frontend hides the option)
- Reactivation requires the active count to be < 3 (free users)
- Hard delete is only allowed when `entryCount === 0` (else must complete first)
- Uniqueness: `(userId, name)` applies across active and completed — no duplicate names even with completed items

---

## What to Build

### Schemas: `packages/schemas`

Add to `packages/schemas/src/categories.ts`:

```typescript
export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  isCompleted: z.boolean().optional(),
});
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
```

### Hook additions: `hooks/use-categories.ts`

```typescript
export function useUpdateCategory(): UseMutationResult<Category, ApiError, UpdateCategoryArgs>
export function useDeleteCategory(): UseMutationResult<void, ApiError, string>
```

`UpdateCategoryArgs`: `{ id: string; data: UpdateCategoryDto }`

Both invalidate `['categories']` on success.

(`useDeleteCategory` already exists from F05 — check if it needs updating.)

### Component: `components/common/inline-edit.tsx`

Reusable inline text edit component used for renaming.

```typescript
interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  disabled?: boolean;
  maxLength?: number;
}
```

Behaviour:
- Renders as static text by default with an edit icon that appears on hover
- On click of text or icon: replaces with an auto-focused `<input>`
- On Enter: calls `onSave(newValue)`. Shows a small spinner on the input while saving. Reverts to text on completion.
- On Escape: cancels and reverts to the original value without calling `onSave`
- On blur (clicking away): same as Enter — saves the value
- If `disabled: true`: renders as plain text with no edit affordance

### `CategoryCard` Updates

Add action buttons to each `CategoryCard`:

**When active (`isCompleted: false`):**
- Rename: use `InlineEdit` on the category name. Calls `useUpdateCategory` with `{ name: newValue }`.
  - On 409: show inline error "A category with this name already exists."
- Complete button: "Mark as complete" — opens a confirmation dialog
  - Dialog: "Completing '[name]' means you can no longer add entries to it. You can reactivate it later."
  - Confirm: calls `useUpdateCategory` with `{ isCompleted: true }`
- Delete button (shown only when `entryCount === 0`): opens delete confirmation dialog
  - Dialog: if the category has subcategories: "Deleting '[name]' will also delete its [N] subcategory/ies. This cannot be undone."
  - Dialog: if no subcategories: "Delete '[name]'? This cannot be undone."
  - Confirm: calls `useDeleteCategory(id)`

**When completed (`isCompleted: true`):**
- Rename: hidden (replace with plain text — no edit affordance)
- Reactivate button: "Reactivate"
  - Calls `useUpdateCategory` with `{ isCompleted: false }`
  - If 422 (active limit reached): show toast "You've reached the 3-category limit. Complete another active category first."
- Delete button: shown only when `entryCount === 0` — same dialog as above
- No "Complete" button (already completed)

**"Add category" button (page level in `CategoriesClient`):**
- Appears at the bottom of the list
- Count active categories from the loaded data
- If `activeCategoryCount >= 3` (free user): disable button, show tooltip "Free plan allows 3 active categories. Complete an existing one to make room."
- If `activeCategoryCount < 3`: show an inline input (using `InlineEdit` in creation mode) to enter the new category name, press Enter to create via `useCreateCategory`
- On 422 from API (race condition): show toast with the error message

---

## Files Created or Modified

| File | Action |
|---|---|
| `components/common/inline-edit.tsx` | Create |
| `components/categories/category-card.tsx` | Modify — add all action buttons |
| `components/categories/categories-client.tsx` | Modify — add "Add category" with active count guard |
| `hooks/use-categories.ts` | Modify — add `useUpdateCategory` |
| `packages/schemas/src/categories.ts` | Modify — add `updateCategorySchema` |
| `packages/schemas/src/index.ts` | Modify if needed |

---

## Done When

- [ ] Active categories show a rename affordance (inline edit on the name)
- [ ] Renaming calls the API; duplicate name shows an inline error
- [ ] Completed categories do not show the rename affordance
- [ ] "Mark as complete" shows a confirmation dialog before completing
- [ ] Completing a category marks it visually and disables further mutations
- [ ] Reactivating a completed category re-enables it
- [ ] Reactivation when at the 3-category limit shows a clear error toast
- [ ] Delete button is only visible when `entryCount === 0`
- [ ] Delete shows a confirmation dialog before proceeding
- [ ] "Add category" is disabled with tooltip when at 3 active categories
- [ ] All mutations show success toasts; all errors show error toasts
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
