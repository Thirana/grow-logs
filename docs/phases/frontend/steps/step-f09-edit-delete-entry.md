# Step F09 — Edit + Delete Entry

**Phase:** 4  
**Status:** ⬜ Not started  
**Depends on:** F08 (create entry form and `AddEntrySheet` built)

---

## Goal

Allow users to edit an existing entry by opening the sheet pre-filled with its data, and delete entries with a confirmation dialog.

---

## What to Build

### Schemas: `packages/schemas`

Add `updateEntrySchema` to `packages/schemas/src/entries.ts`:

```typescript
export const updateEntrySchema = createEntrySchema.partial();
export type UpdateEntryDto = z.infer<typeof updateEntrySchema>;
```

Export from `packages/schemas/src/index.ts`.

### Hook: `hooks/use-entries.ts`

Add `useUpdateEntry` and `useDeleteEntry`:

```typescript
interface UpdateEntryArgs {
  id: string;
  data: UpdateEntryDto;
}

export function useUpdateEntry(): UseMutationResult<Entry, ApiError, UpdateEntryArgs>
export function useDeleteEntry(): UseMutationResult<void, ApiError, string>
```

Both invalidate `['entries']` on success.

`useUpdateEntry` calls `PATCH /entries/:id`.  
`useDeleteEntry` calls `DELETE /entries/:id`.

### `AddEntrySheet` → `EntrySheet` Rename

Rename `add-entry-sheet.tsx` to `entry-sheet.tsx` and update all imports.

Add an optional `entry?: Entry` prop. When provided, the sheet is in **edit mode**:
- Pre-fill all form fields from `entry`
- Title changes from "New entry" to "Edit entry"
- Submit calls `useUpdateEntry()` instead of `useCreateEntry()`
- Submit button label: "Save changes"

**Subcategory reassignment guard:** If the user changes the category, reset `subcategoryId` to null — same as create. This is intentional: the old subcategory may not belong to the new category.

**Completed category/subcategory on edit:**
- The category select still shows only active categories. If the entry's existing category is now completed, it is shown as a disabled/greyed option with a "(completed)" label so the user can see which category it is, but cannot select it again.
- The date field is editable. Enforce the same ≤ today rule.

### `EntryRow` Update

`components/dashboard/entry-row.tsx`:
- Add an edit button (pencil icon) that calls an `onEdit?: (entry: Entry) => void` prop
- Add a delete button (trash icon) with a confirmation `AlertDialog`

### Alert Dialog for Delete

When the delete button is clicked:
- Open a shadcn `AlertDialog`
- Title: "Delete entry?"
- Description: "This entry will be permanently deleted. This cannot be undone."
- Confirm button: "Delete", calls `useDeleteEntry(entry.id)`
- Cancel button: "Cancel"
- Confirm button disabled + spinner while the mutation is in flight
- On success: close dialog, show toast "Entry deleted"
- On error: show toast with `getApiErrorMessage(error)`

### `DashboardClient` Wiring

`components/dashboard/dashboard-client.tsx`:
- Add `selectedEntry: Entry | null` state
- Pass `onEdit={(entry) => setSelectedEntry(entry)}` to `RecentEntries`
- Open `EntrySheet` in edit mode when `selectedEntry` is not null
- On sheet close: reset `selectedEntry` to null

---

## Files Created or Modified

| File | Action |
|---|---|
| `components/dashboard/add-entry-sheet.tsx` | Rename to `entry-sheet.tsx` + add edit mode |
| `components/dashboard/entry-row.tsx` | Modify — add edit + delete buttons |
| `components/dashboard/dashboard-client.tsx` | Modify — wire edit/delete to `EntrySheet` |
| `hooks/use-entries.ts` | Modify — add `useUpdateEntry`, `useDeleteEntry` |
| `packages/schemas/src/entries.ts` | Modify — add `updateEntrySchema` |
| `packages/schemas/src/index.ts` | Modify if needed |

---

## Done When

- [ ] Clicking edit on an entry row opens the sheet pre-filled with entry data
- [ ] Saving the edit calls `PATCH /entries/:id` and updates the list without a reload
- [ ] Changing the category in edit mode resets the subcategory field
- [ ] Clicking delete shows the confirmation dialog
- [ ] Confirming delete removes the entry from the list
- [ ] Confirm button shows a spinner while the deletion is in flight
- [ ] Both mutations show success toasts on completion
- [ ] Both mutations show error toasts on failure
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
