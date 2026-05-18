# Step F10 — Categories Page + List

**Phase:** 5  
**Status:** ⬜ Not started  
**Depends on:** F07 (dashboard wired, `useCategories` exists from F05)

---

## Goal

A dedicated categories page that lists all of the user's categories and subcategories with their current state (active vs completed). Read-only in this step — mutations are added in F11 and F12.

---

## What to Build

### Route: `app/(dashboard)/categories/page.tsx`

Server component. Title metadata: `Categories`. Renders `CategoriesClient`.

### Component: `components/categories/categories-client.tsx`

`'use client'` component. Calls `useCategories()` and renders the full list.

States to handle:
- **Loading:** `CategoriesListSkeleton`
- **Error:** error message + retry button
- **Empty:** "No categories yet" with a call-to-action to add one (button enabled in F11)
- **Loaded:** list of `CategoryCard` components

### Component: `components/categories/category-card.tsx`

One card per category. Displays:
- Category name
- Active/Completed badge: a small pill — "Active" (green) or "Completed" (muted/grey)
- Entry count: "N entries"
- Subcategory count: "N subcategories (M active)"
- Subcategories list: each subcategory shown as a row with its own active/completed state
- Action area (empty placeholder for now — buttons added in F11/F12)

**Completed state visual treatment:** When `isCompleted: true`, the card is rendered with reduced opacity (`opacity-60`) and a strikethrough or completed icon on the name to distinguish it from active categories at a glance.

### Component: `components/categories/categories-list-skeleton.tsx`

Three placeholder category card shapes with pulsing backgrounds.

### Sidebar Link

Add a "Categories" link to the dashboard sidebar (`components/dashboard/sidebar.tsx`):
- Icon: folder or tag icon from `lucide-react`
- Link to `/categories`
- Highlight as active when on the categories page

---

## Files Created or Modified

| File | Action |
|---|---|
| `app/(dashboard)/categories/page.tsx` | Create |
| `components/categories/categories-client.tsx` | Create |
| `components/categories/category-card.tsx` | Create |
| `components/categories/categories-list-skeleton.tsx` | Create |
| `components/dashboard/sidebar.tsx` | Modify — add Categories link |

---

## Done When

- [ ] `/categories` renders the list of user categories
- [ ] Active and completed categories are visually distinct
- [ ] Each card shows category name, entry count, and subcategory list
- [ ] Each subcategory row shows its name and active/completed state
- [ ] Loading skeleton shown while data fetches
- [ ] Empty state shown when user has no categories
- [ ] Sidebar has a working Categories link
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
