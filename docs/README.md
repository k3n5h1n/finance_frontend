# Finance Frontend — Project Documentation

This folder documents how the application is structured and the conventions to follow when extending it. It reflects the **current** codebase, not aspirational design.

## Contents

| Document | Topics |
|----------|--------|
| [Architecture](./architecture.md) | Stack, folder layout, routing, organization context, domain areas |
| [API handling](./api-handling.md) | `orgFetch`, proxies, `apiConfig`, errors, backend URL conventions |
| [Styling](./styling.md) | Bootstrap, themes, CSS variables, page styles, icons |
| [Forms and validation](./forms-and-validation.md) | React Hook Form, Zod schemas, Marshmallow payload rules |
| [UI patterns](./ui-patterns.md) | Modals, dialogs, lists, trees, responsive layouts |
| [Accounting domain](./accounting-domain.md) | Transaction hierarchy, reports, accounts, editability rules |

## Quick start

```bash
npm install
npm run dev      # Vite on :5173
npm run build
npm run lint
```

The backend must be running and reachable via `API_PROXY_TARGET` (see [API handling](./api-handling.md)).

## Before wiring a new backend endpoint

1. Get the exact URL, HTTP method, and request/response shape from API Fairy (or the backend team).
2. Add the path to the relevant `apiConfig.js` — do not guess path segments or trailing slashes.
3. Implement the call in the matching `*Api.js` file using existing `request` / `orgFetch` patterns.
4. Document non-obvious payload requirements in a short comment at the call site.
