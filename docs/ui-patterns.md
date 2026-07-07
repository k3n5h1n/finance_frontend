# UI patterns

## In-app dialogs (`AppDialog` + `useAppDialog`)

Replace `window.confirm` and `window.alert` for application messaging.

```javascript
const { confirm, alert, dialogProps, Dialog } = useAppDialog();

const ok = await confirm({
  title: "Delete entry",
  message: "…",
  confirmLabel: "Delete",
});
if (!ok) return;

await alert({
  title: "Save failed",
  message: err.message,
  confirmVariant: "danger",
});

return (
  <>
    {/* page content */}
    <Dialog {...dialogProps} />
  </>
);
```

**Reserve native browser dialogs** for true browser actions (e.g. unsaved navigation warnings) if needed later.

Modals that use dialogs nest `<Dialog {...dialogProps} />` inside the modal fragment so errors can display above the form.

## Entity modals

Standard CRUD modals:

| Pattern | Example |
|---------|---------|
| Props | `isOpen`, `onClose(saved)`, `mode`, entity record |
| View mode | Read-only fields, no submit |
| Add / edit | React Hook Form + Zod |
| Success | `onClose(true)` → parent refetches |
| Cancel | `onClose(false)` |

Bootstrap modal structure: `modal show d-block` overlay (no separate backdrop component in most modals).

## List pages

Common structure:

1. Header row: title + primary action (`Add …`)
2. Loading: simple `<p>Loading…</p>`
3. Error: `alert alert-danger`
4. Data: table or cards
5. Modal at bottom of fragment

### List pages with filters and pagination

**Events list** is the reference implementation for server-driven lists.

1. **Filter card** — filter controls above the table; changes reset to page 1 and refetch
2. **Debounced text search** — description filter waits ~400ms before applying
3. **Pagination** — `ListPagination` component above and below the table
4. **API** — `listEvents(orgId, filters)` sends query params; response normalized via `normalizePaginatedListResponse`

Reusable pieces:

| Piece | Location |
|-------|----------|
| `ListPagination` | `src/components/ListPagination.jsx` |
| `normalizePaginatedListResponse` | `src/utils/paginatedList.js` |

When adding pagination to another list, wire `page_number` / `page_size` in `*Api.js` and reuse `ListPagination` with the same envelope shape.

**Events list** also supports replicate via `ReplicateEventModal`.

## Expandable tree tables

Used in: Accounts list, Income Statement, Balance Sheet.

State: `expandedIds` as `Set<number>`.

- `getExpandableIds(accounts)` — expand all
- Toggle on chevron click only (not whole row)
- Recursive row component flattens visible nodes

Shared styles: `accounts.css` tree classes; reports use `reportComponents.jsx`.

## Event workspace

Multi-level document UI on one page:

- Header card: event metadata + actions (edit, replicate, **post event**, delete, add group)
- Sections per entry group with entries as cards; group header has **post group**
- Entry lines in table; line items in expandable sub-row
- Each level has its own modal component

After any mutation, **reload full event** via `getEvent` — do not patch local tree incrementally unless you add optimistic update logic deliberately.

### Editability

- Event header edit: allowed even when posted
- Add/delete entry, lines, items: draft event and draft entry only
- **Post** actions (green check icon via `PostActionButton`):
  - **Entry** — draft, has lines, debits = credits (`canPostEntry`)
  - **Entry group** — all entries in the group balanced; at least one draft entry postable (`canPostEntryGroup`)
  - **Event** — all entries across all groups balanced; at least one draft entry postable (`canPostEvent`)

Disabled post buttons show the block reason in a tooltip (`event-post-btn-wrap`). Confirm via `useAppDialog` before calling `postEntry`, `postEntryGroup`, or `postEvent`.

## Drill-through links

Reports → Account History:

```
/accounting/account-history?account={id}&start_date=…&end_date=…
```

Income statement passes both dates; balance sheet passes `end_date` only.

Account History reads `useSearchParams()` on load and passes dates to `getAccountHistory`.

Events list/workspace → event detail:

```
/accounting/events/{eventId}
```

## Responsive behavior

Pattern used where mobile matters:

```jsx
<div className="table-responsive d-none d-md-block">{/* table */}</div>
<div className="d-md-none">{/* cards */}</div>
```

Not every page has mobile cards yet; add both when the list is a primary workflow on phone.

## Navigation

`sidebarNav.js` supports nested children (e.g. Financial Reports). Routes must be registered separately in `App.jsx`.

Active link highlighting compares `location.pathname` to `item.href` (exact match).

## Accessibility basics

- `aria-label` on org selector and icon buttons (`title` + button)
- `aria-expanded` on tree toggles
- Form labels associated with `htmlFor` / `id`
- Modal `role="dialog"` and `aria-modal="true"` on custom modals

## Anti-patterns

- Do not use `window.confirm` for delete in new code — use `useAppDialog`
- Do not guess API URLs — see [API handling](./api-handling.md)
- Do not store org ID only in context without syncing `setActiveOrganizationId` when it changes
