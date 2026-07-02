# API handling

## Two request paths

The app uses **two base URL strategies**:

### 1. Organization-scoped APIs (`orgFetch`)

Used for: accounts, suppliers, accounting (events, reports), and anything that requires `X-Organization-Id`.

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
Proxy:    GET http://172.17.0.1:5002/accounting/events/
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
4. `normalizeListResponse()` where list shape varies (`[]`, `{ results }`, `{ events }`, etc.)

## Backend URL conventions (accounting)

Paths use **underscores** in segment names. Trailing slashes differ by endpoint — **match API Fairy exactly**.

| Operation | Pattern (examples) |
|-----------|-------------------|
| Event detail PATCH | `/accounting/events/{id}` (no trailing slash) |
| Entry group detail | `/accounting/entry_groups/{id}/` (with slash) |
| Nested create | `/accounting/events/{id}/entry_groups` (no trailing slash) |
| Entry line create | `/accounting/entries/{id}/entries` |
| Line item create | `/accounting/entry_lines/{id}/line_items` |
| Line item update/delete | `/accounting/line_items/{id}/` |

**Rule:** Confirm create vs detail URLs separately. Nested collection names may differ from the shallow resource name (e.g. entry lines created under `entries`, updated under `entry_lines`).

## Reports

| Report | Endpoint |
|--------|----------|
| Income statement | `GET /accounting/reports/income_statement/` |
| Balance sheet | `GET /accounting/reports/balance_sheet/` |

Query parameters (GET only — no JSON body):

- `fiscal_year` (integer)
- `posted_only` (`true` / `false` string)

Future reports should follow the same `/accounting/reports/<report_name>/` pattern.

## PATCH payloads (Marshmallow)

The backend often expects a **full resource payload** on PATCH, not a partial diff. Include:

- All editable fields
- `display_order` where applicable
- `is_posted` on entries
- `supplier_id: null` to clear an optional supplier (omit on create)

Validation schemas in `src/utils/validation/` expose helpers like `formValuesToUpdatePayload(data, existingRecord)` to build complete bodies.

## Date and datetime fields

| Field type | Frontend format |
|------------|-----------------|
| Entry `date` | `YYYY-MM-DD` (HTML date input) |
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
