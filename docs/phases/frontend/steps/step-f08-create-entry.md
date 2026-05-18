# Step F08 — Create Entry

**Phase:** 4  
**Status:** ⬜ Not started  
**Depends on:** F07 (entries list wired, `useCategories` exists from F05)

---

## Goal

Wire the existing `AddEntrySheet` to the real API. A user can open the sheet from the dashboard, fill in the form, and create a new entry that immediately appears in the list.

---

## What to Build

### Schemas: `packages/schemas`

Check `packages/schemas/src/entries.ts`. If `createEntrySchema` does not exist, add it:

```typescript
export const createEntrySchema = z.object({
  type: z.enum(['WORK', 'LEARNING']),
  text: z.string()
    .min(10, 'Entry must be at least 10 characters')
    .max(1000, 'Entry must be 1 000 characters or less'),
  score: z.number().int().min(1).max(10).optional().nullable(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date'),
  categoryId: uuidSchema,
  subcategoryId: uuidSchema.optional().nullable(),
});

export type CreateEntryDto = z.infer<typeof createEntrySchema>;
```

Add `createEntrySchema` to `packages/schemas/src/index.ts` if not already exported.

### Hook: `hooks/use-entries.ts`

Add `useCreateEntry`:

```typescript
export function useCreateEntry(): UseMutationResult<Entry, ApiError, CreateEntryDto>
```

- Posts to `POST /entries`
- On success: `queryClient.invalidateQueries({ queryKey: ['entries'] })` — refreshes both list and summary

### Component: `components/dashboard/add-entry-sheet.tsx`

The sheet already exists with mock wiring. Replace it with a real form:

**Form fields:**

| Field | UI control | Validation |
|---|---|---|
| Type | Toggle / segmented control: "Work" / "Learning" | Required |
| Date | Date input or date picker, capped at today | Required, ≤ today |
| Category | Select populated from `useCategories()` — show only active (`isCompleted: false`) categories | Required |
| Subcategory | Select populated from the selected category's active subcategories. Hidden when selected category has no active subcategories | Optional |
| Text | Textarea | Min 10, max 1 000 chars with counter |
| Score | Number input or 1–10 slider | Optional, 1–10 integer |

**Date cap implementation:** Set the `max` attribute on the date input to today's ISO date string.

```typescript
const todayStr = new Date().toISOString().split('T')[0]; // "2025-05-16"
<input type="date" max={todayStr} ... />
```

**Category/Subcategory cascade:** When the category selection changes, reset `subcategoryId` to null. The subcategory select is re-populated from the newly selected category's subcategory list.

**Character counter:** Show "N / 1000" below the textarea, turning red when over 950.

**Schema:** `createEntrySchema` from `packages/schemas` with `zodResolver`.

**On submit:**
1. Call `useCreateEntry()`
2. On success: close sheet, reset form, show success toast "Entry added"
3. On 422 (daily limit reached): show toast "You've reached today's 10-entry limit. Upgrade to Pro for unlimited entries."
4. On 422 (completed category): show toast with the API error message
5. On other errors: show `getApiErrorMessage(error)` as a toast

**Submit button:** disabled + spinner while in flight. Label: "Save entry".

---

## Files Created or Modified

| File | Action |
|---|---|
| `components/dashboard/add-entry-sheet.tsx` | Modify — wire to `useCreateEntry`, real form |
| `hooks/use-entries.ts` | Modify — add `useCreateEntry` |
| `packages/schemas/src/entries.ts` | Modify if needed |
| `packages/schemas/src/index.ts` | Modify if needed |

---

## Done When

- [ ] Opening the sheet shows the form with type, date, category, text, and score fields
- [ ] Category select shows only active (non-completed) categories
- [ ] Subcategory select is hidden when selected category has no active subcategories
- [ ] Date picker is capped at today — future dates cannot be selected
- [ ] Character counter shows below the textarea
- [ ] Submitting a valid form creates the entry and it appears in the list
- [ ] The list and summary refresh without a page reload
- [ ] Daily limit error shows a clear, user-friendly toast
- [ ] All form fields show inline validation errors
- [ ] Submit button is disabled + shows spinner while the request is in flight
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
