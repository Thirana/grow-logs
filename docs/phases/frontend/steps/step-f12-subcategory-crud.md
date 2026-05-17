# Step F12 — Subcategory CRUD

**Phase:** 5  
**Status:** ⬜ Not started  
**Depends on:** F11 (`InlineEdit` component exists, category mutation patterns established)

---

## Goal

Full create, rename, complete, reactivate, and delete for subcategories. Reuses the same inline edit and confirmation dialog patterns from F11.

---

## Product Rules (from `PRODUCT_LIMITS.md`)

- Free tier: max **5 active subcategories per category** (counted independently per category)
- Completed subcategories do not count toward the limit
- Cannot add new subcategories to a **completed parent category** — the UI hides this action entirely when the parent is completed
- Cannot rename a completed subcategory
- Hard delete is only allowed when the subcategory has `entryCount === 0` (else must complete first)
- Reactivation requires: parent category is active AND active subcategory count < 5

The `Category` type already includes the full `subcategories` array from `GET /categories`. Use `subcategories.filter(s => !s.isCompleted).length` to compute the active count client-side.

---

## What to Build

### Types: `packages/types/src/index.ts`

The `Subcategory` interface already exists (added in F05). Verify it includes `entryCount`:

```typescript
export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  isCompleted: boolean;
  entryCount: number;   // add if missing
  createdAt: string;
}
```

If `entryCount` is missing, add it now.

### Schemas: `packages/schemas`

Add to `packages/schemas/src/categories.ts`:

```typescript
export const updateSubcategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  isCompleted: z.boolean().optional(),
});
export type UpdateSubcategoryDto = z.infer<typeof updateSubcategorySchema>;
```

### Hook additions: `hooks/use-categories.ts`

```typescript
export function useUpdateSubcategory(): UseMutationResult<Subcategory, ApiError, UpdateSubcategoryArgs>
export function useDeleteSubcategory(): UseMutationResult<void, ApiError, DeleteSubcategoryArgs>
```

`UpdateSubcategoryArgs`: `{ categoryId: string; subId: string; data: UpdateSubcategoryDto }`  
`DeleteSubcategoryArgs`: `{ categoryId: string; subId: string }`

(`useCreateSubcategory` already exists from F05.)

Both invalidate `['categories']` on success.

### Component: `components/categories/subcategory-row.tsx`

One row per subcategory inside a `CategoryCard`. Displays:
- Subcategory name (inline editable when active)
- Active/Completed badge
- Entry count: "N entries" (small, muted text)
- Actions

**When active (`isCompleted: false`):**
- Rename: `InlineEdit` on the name, calls `useUpdateSubcategory` with `{ name: newValue }`
  - On 409: show inline error "A subcategory with this name already exists in this category."
- Complete button: "Mark complete" — confirmation dialog
  - Dialog: "Completing '[name]' means it won't appear in the entry subcategory dropdown. You can reactivate it later."
  - Confirm: calls `useUpdateSubcategory` with `{ isCompleted: true }`
- Delete button (shown only when `entryCount === 0`): confirmation dialog
  - Dialog: "Delete '[name]'? This cannot be undone."
  - Confirm: calls `useDeleteSubcategory({ categoryId, subId })`

**When completed (`isCompleted: true`):**
- Rename: hidden
- Reactivate button: "Reactivate"
  - Calls `useUpdateSubcategory` with `{ isCompleted: false }`
  - If 422 (active subcategory limit for this category reached): show toast "This category already has 5 active subcategories."
  - If 422 (parent category is completed): show toast "Reactivate '[category name]' first before reactivating subcategories."
- Delete button: shown only when `entryCount === 0`

### "Add subcategory" inside `CategoryCard`

At the bottom of each `CategoryCard`'s subcategory list:
- Show "Add subcategory" button only when the parent category is **active** (`isCompleted: false`)
- If `activeSubcategoryCount >= 5`: disable button, show tooltip "Free plan allows 5 active subcategories per category."
- If `activeSubcategoryCount < 5`: inline input to enter name, Enter to create via `useCreateSubcategory`

**Active subcategory count:** compute from `category.subcategories.filter(s => !s.isCompleted).length`.

---

## Files Created or Modified

| File | Action |
|---|---|
| `components/categories/subcategory-row.tsx` | Create |
| `components/categories/category-card.tsx` | Modify — render `SubcategoryRow` list + "Add subcategory" |
| `hooks/use-categories.ts` | Modify — add `useUpdateSubcategory`, `useDeleteSubcategory` |
| `packages/schemas/src/categories.ts` | Modify — add `updateSubcategorySchema` |
| `packages/schemas/src/index.ts` | Modify if needed |
| `packages/types/src/index.ts` | Modify — add `entryCount` to `Subcategory` if missing |

---

## Done When

- [ ] Each subcategory row shows name, active/completed state, and entry count
- [ ] Renaming an active subcategory works; duplicate name shows an inline error
- [ ] Completing a subcategory marks it visually and removes its edit affordances
- [ ] Reactivating a subcategory re-enables it
- [ ] Reactivation when at the 5-subcategory limit shows a clear error toast
- [ ] Reactivation when parent is completed shows the correct error toast
- [ ] Delete button visible only when `entryCount === 0`
- [ ] "Add subcategory" hidden when parent category is completed
- [ ] "Add subcategory" disabled with tooltip when at 5 active subcategories
- [ ] All mutations show success toasts; errors show error toasts
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
