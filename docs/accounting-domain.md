# Accounting domain

Frontend model for transactions, accounts, and reports. Backend is Flask + Marshmallow; this document describes what the UI assumes.

## Transaction hierarchy

Five levels, top to bottom:

```
Event
└── Entry group
    └── Entry
        └── Entry line
            └── Line resource
```

| Level | Key fields | Notes |
|-------|------------|--------|
| Event | `description`, `type`, `status`, `is_external` | Container; status derived from entries. Types (API): `normal`, `opening_balance`, `year_end_close` |
| Entry group | `description`, `type`, `display_order` | Types: primary, adjustment, accrual, reversal |
| Entry | `date`, `description`, `is_posted`, `display_order` | Posted entries are immutable in UI |
| Entry line | `account`, `supplier`, `debit`, `credit`, `display_order` | Exactly one of debit/credit non-zero |
| Line resource | `description`, `quantity`, `unit_measure`, `unit_amount`, `extended_amount`, optional `resource_id` | Optional breakdown of line amount; may link to setup catalog `/resources/`. Quantity may be negative; `extended_amount = abs(quantity) × unit_amount` (sign follows unit cost only) |

### Reading data

- **List:** `GET /accounting/events/` — shallow rows with `entries_start`, `entries_end`, `status`, etc. Supports filters and pagination (see [API handling](./api-handling.md#events-list-filters)).
- **Workspace:** `GET /accounting/events/{id}` — full nested tree with embedded account/supplier stubs on lines

### Posting

| Level | API | UI helper |
|-------|-----|-----------|
| Entry | `PATCH /accounting/entries/{id}/post` | `canPostEntry`, `getPostEntryBlockReason` |
| Entry group | `PATCH /accounting/entry_groups/{id}/post` | `canPostEntryGroup`, `getPostEntryGroupBlockReason` |
| Event | `PATCH /accounting/events/{id}/post` | `canPostEvent`, `getPostEventBlockReason` |

**Entry:** must be draft, have at least one line, and be balanced (debits = credits within 0.005).

**Entry group / event:** every entry must be balanced; at least one draft entry must remain; each draft entry must also pass entry-level checks (e.g. has lines). Posted entries count toward the balance requirement but are not re-posted.

### Writing data

Create endpoints are **nested**; update/delete use **shallow** resource URLs. See [API handling](./api-handling.md) for the full table.

**Replicate event:** `POST /accounting/events/{id}/replicate` with optional `include_line_resources`, `entries_date` (datetime string).

## Event status (frontend)

```javascript
deriveEventStatus(event)
```

- **Draft** if no entries or any entry is draft (`!is_posted`)
- **Posted** only if every entry is posted

`isEventEditable(event)` is true when `status === "draft"` (gates add/delete at event level, not header edit).

## Entry groups in the UI

Entry groups are **always shown** in the workspace (no hiding single primary group). Each group section has Add Entry, **Post group**, and edit-group actions.

Auto-create: adding an entry when no group exists creates a primary entry group with the event description.

## Accounts

### Chart of accounts

- Hierarchical via `parent` / `parent_id`
- Types: `asset`, `liability`, `equity`, `revenue`, `expense`
- Tree built client-side: `buildAccountTree`, `flattenAccountTreeForSelect`

### Account history

`GET /accounts/{id}/history` with optional query params:

- `start_date`, `end_date`
- `page_number`, `page_size` (API ready; UI not paginated yet)

Rows include running balance, event link, posted flag.

## Reports

### Income statement

`GET /accounting/reports/income_statement/?fiscal_year=&posted_only=`

- Sections: **Revenue**, **Expense**
- Period: `start_date` – `end_date`
- Footer: **Net income**
- Balances are rolled up (own + children)

### Balance sheet

`GET /accounting/reports/balance_sheet/?fiscal_years=2025&fiscal_years=2026&posted_only=`

- Query: repeated `fiscal_years` (preferred); optional top-level `posted_only` echo
- Response: `periods[]` (per-year metadata/totals/`balanced`/`end_date`) + flat `rows[]` with `account` and `balances[]` aligned by period index
- UI sorts periods **newest first**; amount column headers use each period’s `end_date` (not fiscal year)
- Sections: **Asset**, **Liability**, **Equity** (from `account.type`)
- Equity section handles empty chart gracefully: "No equity accounts defined."
- Year picker: multi-select checkboxes (non-sequential years allowed); default current + prior when available
- Account history drill-through uses the leftmost (most recent) period `end_date`

### Inventory on-hand

`GET /accounting/reports/inventory/?as_of_date=&posted_only=`

- Nav: Finances → Inventory → On-Hand (`/accounting/reports/inventory`)
- Response: `items[]` with `resource_id`, `resource_name`, `default_units`, `quantity` (may be negative)
- Optional filters: `as_of_date` (`YYYY-MM-DD`), `posted_only` (default false); blank as-of date omits the param (current on-hand)
- UI sorts by resource name; negative quantities shown in danger color

### Shared report UI

- Income statement: single fiscal year dropdown (legacy API until multi-year lands)
- Balance sheet: multi-select fiscal years; comparative columns
- Posted only checkbox
- Expand/collapse all
- Eye icon → account history with report date context
- Balanced badge(s): per period under balance sheet column headers

Report tree building: `buildReportSectionTree` (single balance) / `buildMultiPeriodReportSectionTree` (balances array) merge API amounts onto chart hierarchy.

## Amounts and formatting

| Helper | Use |
|--------|-----|
| `formatAmount` | Currency, 2 decimal places |
| `formatUnitCost` | Line resource unit cost, always 4 decimals |
| `formatDate` | ISO date → locale short date |
| `formatDateTime` | Timestamps on event header |

Ledger columns show em dash for zero debit/credit in history tables.

## Sorting conventions

| View | Sort |
|------|------|
| Events list | Server-side (default from API; was client-side before pagination) |
| Workspace children | `display_order` asc, `id` tiebreaker |
| Account tree | Type order, then name |

## Key source files

| Area | Files |
|------|--------|
| Events API | `pages/events/apiConfig.js`, `eventsApi.js` |
| Event UI | `EventsList.jsx`, `EventWorkspace.jsx`, `*Modal.jsx` |
| Event logic | `eventUtils.js` |
| List pagination | `components/ListPagination.jsx`, `utils/paginatedList.js` |
| Accounts | `accountsApi.js`, `accountTree.js`, `AccountHistory.jsx` |
| Resources | `pages/resources/resourcesApi.js`, `ResourcesList.jsx`, `ResourceModal.jsx` |
| Reports | `reportsApi.js`, `IncomeStatement.jsx`, `BalanceSheet.jsx`, `InventoryOnHand.jsx`, `reportComponents.jsx` |
| Validation | `src/utils/validation/*Schema.js` |

## Resources (setup catalog)

Org-scoped catalog at `/resources/` (distinct from accounting **line resources** on entry lines).

| Field | Notes |
|-------|--------|
| `name`, `type`, `is_active` | Types: `ITEM`, `INSTRUMENT`, `SERVICE`, `PROPERTY` |
| `item` | Present when `type === "ITEM"`: `tracks_quantity`, optional `default_units` |

List endpoint has no filters/pagination yet; UI sorts client-side by name.

Accounting line resources may optionally set `resource_id` to a catalog resource (Item or Service). Selecting a catalog row populates line `description` from `name`; Items also copy `item.default_units` into `unit_measure` when present. Those values are stored on the line resource and remain editable without updating the catalog. Unlinking sets `resource_id: null` and keeps the copied fields.

## Future backend features (UI hooks ready or planned)

- `posted_only` on reports — implemented in UI
- Account history pagination — query params in `getAccountHistory`, no list UI yet
- Paginated lists (suppliers, accounts, resources, etc.) — reuse `ListPagination` + `normalizePaginatedListResponse` (events list is the reference)
- Own vs children balance on reports — API may add; UI shows rolled-up only today
- Cashflow statement — follow same report pattern as income/balance sheet
- Resource list filters/pagination — API planned; UI not yet