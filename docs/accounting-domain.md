# Accounting domain

Frontend model for transactions, accounts, and reports. Backend is Flask + Marshmallow; this document describes what the UI assumes.

## Transaction hierarchy

Five levels, top to bottom:

```
Event
└── Entry group
    └── Entry
        └── Entry line
            └── Line item
```

| Level | Key fields | Notes |
|-------|------------|--------|
| Event | `description`, `status`, `is_external` | Container; status derived from entries |
| Entry group | `description`, `type`, `display_order` | Types: primary, adjustment, accrual, reversal |
| Entry | `date`, `description`, `is_posted`, `display_order` | Posted entries are immutable in UI |
| Entry line | `account`, `supplier`, `debit`, `credit`, `display_order` | Exactly one of debit/credit non-zero |
| Line item | `description`, `quantity`, `unit_measure`, `unit_amount`, `extended_amount` | Optional breakdown of line amount |

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

**Replicate event:** `POST /accounting/events/{id}/replicate` with optional `include_line_items`, `entries_date` (datetime string).

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

`GET /accounting/reports/balance_sheet/?fiscal_year=&posted_only=`

- Sections: **Asset**, **Liability**, **Equity** (in that order)
- **Period Ending:** from `end_date` (no start date)
- **Balanced** badge from boolean `balanced` (assets vs liabilities + equity)
- Equity section handles empty chart gracefully: "No equity accounts defined."

### Shared report UI

- Fiscal year dropdown (`2025`, `2026`; default current calendar year)
- Posted only checkbox
- Expand/collapse all
- Eye icon → account history with report date context

Report tree building: `buildReportSectionTree(allAccounts, reportRows)` merges API balances onto chart hierarchy.

## Amounts and formatting

| Helper | Use |
|--------|-----|
| `formatAmount` | Currency, 2 decimal places |
| `formatUnitCost` | Line item unit cost, up to 3 decimals |
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
| Reports | `reportsApi.js`, `IncomeStatement.jsx`, `BalanceSheet.jsx`, `reportComponents.jsx` |
| Validation | `src/utils/validation/*Schema.js` |

## Future backend features (UI hooks ready or planned)

- `posted_only` on reports — implemented in UI
- Account history pagination — query params in `getAccountHistory`, no list UI yet
- Paginated lists (suppliers, accounts, etc.) — reuse `ListPagination` + `normalizePaginatedListResponse` (events list is the reference)
- Own vs children balance on reports — API may add; UI shows rolled-up only today
- Cashflow statement — follow same report pattern as income/balance sheet
