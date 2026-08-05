# API handling

## Two request paths

The app uses **two base URL strategies**:

### 1. Organization-scoped APIs (`orgFetch`)

Used for: accounts, suppliers, resources, accounting (events, reports), and anything that requires `X-Organization-Id`.

```javascript
import { orgFetch } from "../../utils/orgRequest";

const res = await orgFetch(url, { method: "POST", ... }, organizationId);
```

- Base URL: `VITE_ORG_SCOPED_API_BASE_URL` ?? `VITE_API_BASE_URL`
- In development, `VITE_ORG_SCOPED_API_BASE_URL=/api` routes through the Vite proxy (avoids CORS on custom headers).
- `orgFetch` always sets `Accept: application/json` and the org header.
- Throws if `organizationId` is null.

### 2. Global setup APIs (plain `fetch`)

Used for: organizations, people.

```javascript
const res = await fetch(`${API_BASE}/organizations/`);
```

- Base URL: `VITE_API_BASE_URL` (typically direct to backend port).
- No organization header.

When adding a new API, confirm with the backend whether it is org-scoped before choosing a wrapper.

## Vite dev proxy

`vite.config.js` proxies `/api/*` → `API_PROXY_TARGET`, stripping the `/api` prefix:

```
Browser:  GET /api/accounting/events/
Proxy:    GET http://{IP address}:{port}/accounting/events/
```

Org-scoped `apiConfig` files should use `/api` in development so browser requests stay same-origin.

## File layout convention

Per feature module:

```
pages/<feature>/apiConfig.js   # URL builders only
pages/<feature>/<feature>Api.js # async functions, error parsing
```

**`apiConfig.js`** — no fetch logic, only paths:

```javascript
const API_BASE =
  import.meta.env.VITE_ORG_SCOPED_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL;

export const EVENTS_API = {
  LIST: `${API_BASE}/accounting/events/`,
  DETAIL: (id) => `${API_BASE}/accounting/events/${id}`,
};
```

**`*Api.js`** — shared patterns in accounting (`eventsApi.js`, `reportsApi.js`, `accountsApi.js`):

1. `parseResponseBody(res)` — read text, JSON parse, fallback to `{ message }`
2. `formatApiError(data)` — normalize Flask/Marshmallow shapes:
   - `detail` (string or array)
   - `messages.json` (field → messages)
   - `message`, `error`
3. `request()` or `fetchReport()` — call `orgFetch`, throw `Error` with status + detail on failure
4. List normalization — bare arrays or paginated envelopes (see below)

### Paginated list responses

Several list endpoints return a paginated envelope instead of a bare array:

```json
{
  "results": [ … ],
  "page_number": 1,
  "page_size": 25,
  "total_count": 142,
  "total_pages": 6
}
```

Shared helper: `src/utils/paginatedList.js` → `normalizePaginatedListResponse(data, resultKeys)`.

- Accepts a bare array (legacy) and synthesizes page metadata.
- `resultKeys` names the results array per resource (e.g. `["results", "events"]` for events).

Query parameters (when supported):

| Param         | Purpose            |
| ------------- | ------------------ |
| `page_number` | 1-based page index |
| `page_size`   | Rows per page      |

### Events list filters

`GET /accounting/events/` supports server-side filtering and pagination. Query params:

| Param                       | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `page_number`, `page_size`  | Pagination                                            |
| `description_contains`      | Case-insensitive substring match on event description |
| `entries_start_on_or_after` | Event `entries_start` ≥ date (`YYYY-MM-DD`)           |
| `entries_end_on_or_before`  | Event `entries_end` ≤ date                            |
| `supplier_id`               | Events with at least one line for that supplier       |
| `status`                    | `draft` or `posted`; omit for all statuses            |

Implemented in `listEvents(organizationId, filters)` via `buildEventsListQuery()`. The Transactions list mirrors these as **URL query params** (informational URLs — see [UI patterns](./ui-patterns.md#informational-urls-list-filters)). Other list pages should follow the same param names where applicable.

## Backend URL conventions (accounting)

Paths use **underscores** in segment names. Trailing slashes differ by endpoint — **match API Fairy exactly**.

| Operation                  | Pattern (examples)                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Event detail PATCH         | `/accounting/events/{id}` (no trailing slash)                                                                  |
| Post entry / group / event | `PATCH /accounting/entries/{id}/post`, `…/entry_groups/{id}/post`, `…/events/{id}/post` (empty JSON body `{}`) |
| Entry group detail         | `/accounting/entry_groups/{id}/` (with slash)                                                                  |
| Nested create              | `/accounting/events/{id}/entry_groups` (no trailing slash)                                                     |
| Entry line create          | `/accounting/entries/{id}/entries`                                                                             |
| Line resource create        | `/accounting/entry_lines/{id}/line_resources`                                                                  |
| Line resource update/delete | `/accounting/line_resources/{id}/`                                                                             |

**Rule:** Confirm create vs detail URLs separately. Nested collection names may differ from the shallow resource name (e.g. entry lines created under `entries`, updated under `entry_lines`).

### Accounting line resources

Nested under an entry line; distinct from the setup **catalog** at `/resources/`.

| Field | Notes |
|-------|--------|
| `description` | Required in UI; may be defaulted from a linked catalog item’s `name` |
| `quantity`, `unit_amount`, `extended_amount` | Quantity may be negative (not zero). `unit_amount` supports up to 4 decimals (negative for discounts). UI sets `extended_amount = abs(quantity) × unit_amount` (rounded to cents; sign follows unit cost only) |
| `unit_measure` | Optional; send `null` when empty |
| `display_order` | Required on create/update |
| `resource_id` | Optional FK to setup `/resources/{id}`; send `null` to unlink |

**Linking behavior (UI):** toggle “Link to catalog resource” → type (Item or Service) → active catalog dropdown for that type. Selecting a catalog row populates `description` from `name`. Items also populate `unit_measure` from `item.default_units` when present; services have no default units. Values are editable on the **line resource** only — the catalog record is never updated. Unlinking sets `resource_id: null` and leaves the text fields unchanged.

**Replicate:** `POST /accounting/events/{id}/replicate` with `include_line_resources` (boolean). Do not use `include_resources` — it is accepted but does not copy line resources.

## Reports

| Report           | Endpoint                                    |
| ---------------- | ------------------------------------------- |
| Income statement | `GET /accounting/reports/income_statement/` |
| Balance sheet    | `GET /accounting/reports/balance_sheet/`    |
| Inventory on-hand | `GET /accounting/reports/inventory/`       |

### Resources (setup catalog)

| Operation | Endpoint |
|-----------|----------|
| List / create | `GET`/`POST /resources/` |
| Detail / update / delete | `GET`/`PUT`/`DELETE /resources/{id}` (no trailing slash) |

| Field | Notes |
|-------|--------|
| `name`, `type`, `is_active` | Types: `ITEM`, `INSTRUMENT`, `SERVICE`, `PROPERTY` |
| `item` | When `type === "ITEM"`: required `tracks_quantity`, optional `default_units` |

List has no filters/pagination yet (planned). Org-scoped via `X-Organization-Id`. Used by the Setup → Resources UI and as the optional link target for accounting line resources (`resource_id`).

Query parameters (GET only — no JSON body):

- Income statement: `fiscal_year` (integer), `posted_only` (`true` / `false` string)
- Balance sheet: repeated `fiscal_years` (integers), `posted_only`
- Inventory on-hand: optional `as_of_date` (`YYYY-MM-DD`), `posted_only`

Balance sheet response shape: `{ periods: [...], rows: [{ account, balances: [...] }] }` with optional top-level `posted_only`. UI reorders periods newest-first for display.

Inventory on-hand response shape: `{ items: [{ resource_id, resource_name, default_units, quantity }] }` for catalog resources of type ITEM.

## Posting (entries, groups, events)

Posting uses dedicated **`PATCH …/post`** endpoints — not a manual `PATCH` with `is_posted: true`.

| Level       | Endpoint                                   | Effect                               |
| ----------- | ------------------------------------------ | ------------------------------------ |
| Entry       | `PATCH /accounting/entries/{id}/post`      | Posts that entry                     |
| Entry group | `PATCH /accounting/entry_groups/{id}/post` | Posts all draft entries in the group |
| Event       | `PATCH /accounting/events/{id}/post`       | Posts all draft entries in the event |

Request: `Content-Type: application/json` with body `{}`. Response: updated resource (entry) or nested tree (group/event).

API functions in `eventsApi.js`: `postEntry`, `postEntryGroup`, `postEvent` — shared `postResource()` helper.

## PATCH payloads (Marshmallow)

The backend often expects a **full resource payload** on PATCH, not a partial diff. Include:

- All editable fields
- `display_order` where applicable
- `is_posted` on entry PATCH (editing metadata only — use `/post` to post)
- `supplier_id: null` to clear an optional supplier (omit on create)

Validation schemas in `src/utils/validation/` expose helpers like `formValuesToUpdatePayload(data, existingRecord)` to build complete bodies.

## Date and datetime fields

| Field type               | Frontend format                              |
| ------------------------ | -------------------------------------------- |
| Entry `date`             | `YYYY-MM-DD` (HTML date input)               |
| Replicate `entries_date` | `YYYY-MM-DDT00:00:00` (Marshmallow DateTime) |

## Error handling in UI

- API layer throws `Error` with a readable message.
- Pages catch in try/catch, set local `error` state or call `useAppDialog().alert()`.
- Do not use `window.alert` for application errors — use `AppDialog` (see [UI patterns](./ui-patterns.md)).

## Checklist for new endpoints

- [ ] Exact path and method documented from API Fairy
- [ ] Entry added to `apiConfig.js`
- [ ] Function added to `*Api.js` with `formatApiError` handling
- [ ] Org-scoped vs global fetch chosen correctly
- [ ] Trailing slash matches backend
- [ ] Query params for GET; JSON body for POST/PATCH/PUT
- [ ] Required fields on PATCH verified against Marshmallow schema
