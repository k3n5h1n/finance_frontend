# Architecture

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 |
| Build | Vite 7 |
| Routing | React Router 7 |
| CSS | Bootstrap 5 + project CSS variables |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) |
| Icons | Bootstrap Icons (primary), Remix Icon |

There is no global state library. Server data lives in component state; organization selection uses React Context.

## High-level layout

```
src/
├── App.jsx              # Router shell, org-gated routes
├── main.jsx             # Bootstrap + theme init
├── components/          # Header, SideBar, Logo, AppDialog, ListPagination
├── context/             # OrganizationContext
├── data/                # sidebarNav.js (static nav tree)
├── hooks/               # useAppDialog, useEscapeToClose
├── pages/               # Feature modules (one folder per area)
│   ├── accounts/
│   ├── events/          # Transactions (accounting events)
│   ├── organizations/
│   ├── people/
│   ├── reports/
│   ├── resources/       # Setup catalog (ITEM, etc.)
│   ├── externalData/    # Setup external APIs (banking, investing, weather)
│   ├── investing/       # Investing area (investments, etc.)
│   └── suppliers/
├── styles/              # variables.css (theme tokens)
└── utils/               # orgRequest, paginatedList, listSearchParams, validation schemas
```

Each feature folder typically contains:

- **Page component(s)** — list and/or detail workspace
- **`apiConfig.js`** — URL constants only
- **`*Api.js`** — fetch functions
- **Modal(s)** — create/edit forms
- **`.css`** — page-specific styles (optional)

## Application shell

```
OrganizationProvider
└── Router
    └── AppLayout
        ├── Header          (logo, theme toggle, org selector)
        ├── SideBar         (sidebarNav.js)
        └── <main> Routes   (keyed by selectedOrganizationId)
```

When the user changes organization, `Routes` remount (`key={selectedOrganizationId}`) so list/detail pages reload cleanly without stale data.

## Routing

Routes are declared in `App.jsx`. Navigation structure is duplicated in `src/data/sidebarNav.js` (not generated from routes — keep them in sync manually).

| Area | Example paths |
|------|----------------|
| Setup | `/setup/organizations`, `/setup/people`, `/setup/accounts`, `/setup/resources`, `/setup/external-data` |
| Accounting | `/accounting/events`, `/accounting/events/:eventId`, `/accounting/account-history`, `/accounting/suppliers` |
| Reports | `/accounting/reports/income-statement`, `/accounting/reports/balance-sheet`, `/accounting/reports/inventory` |
| Investing | `/investing/investments`, `/investing/investments/:investmentId` |

## Organization context

Most business data is **organization-scoped**. The selected org ID is:

1. Stored in `OrganizationContext`
2. Mirrored in `orgRequest.setActiveOrganizationId` for `orgFetch`
3. Sent on every org-scoped request as `X-Organization-Id` (configurable via `VITE_ORG_ID_HEADER`)

**Exceptions:** Organizations and People APIs use plain `fetch` against `VITE_API_BASE_URL` without the org header (global setup data).

## Page patterns

### List + modal CRUD

Used for: Organizations, People, Accounts, Suppliers, Events (list only).

- Table on desktop; card list on small screens where implemented
- Modal with `mode`: `add` | `edit` | `view`
- After save, parent refetches or closes modal with `refresh` flag

**Events list** additionally has server-side filters, pagination (`ListPagination`), informational URL query params, and replicate via `ReplicateEventModal`. See [UI patterns](./ui-patterns.md#list-pages-with-filters-and-pagination) and [Informational URLs](./ui-patterns.md#informational-urls-list-filters).

### Document workspace

Used for: **Event workspace** (`/accounting/events/:eventId`).

- Single GET loads full tree (event → entry groups → entries → lines → line resources)
- Inline sections with modals for each level
- Reload full tree after any mutation

### Report pages

Used for: Income Statement, Balance Sheet, Inventory On-Hand.

- Fiscal year + `posted_only` filters (balance sheet: multi-year via `fiscal_years`)
- Inventory On-Hand: optional `as_of_date` + `posted_only`
- Hierarchical account trees with expand/collapse (financial statements)
- Drill-through links to Account History with query params
- Balance sheet comparative columns headed by period `end_date`, newest left

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_ORG_SCOPED_API_BASE_URL` | Base for org-scoped APIs (dev: `/api` → Vite proxy) |
| `VITE_API_BASE_URL` | Direct backend URL for org/people setup APIs |
| `VITE_ORG_ID_HEADER` | Header name (default `X-Organization-Id`) |
| `API_PROXY_TARGET` | Backend origin for Vite proxy (e.g. `http://172.17.0.1:5002`) |

See [API handling](./api-handling.md) for proxy details.

## Adding a new feature area

1. Create `src/pages/<area>/` with page, `apiConfig.js`, `*Api.js` as needed.
2. Register route in `App.jsx`.
3. Add nav entry in `sidebarNav.js`.
4. Add validation schema under `src/utils/validation/` if the feature has forms.
5. Prefer colocating area-specific utils (e.g. `accountTree.js`) in the feature folder.
