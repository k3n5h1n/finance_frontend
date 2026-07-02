# Styling

## Approach

The UI is built on **Bootstrap 5** with a thin custom theme layer. Prefer Bootstrap utility classes and components before writing new CSS.

Load order (`main.jsx`):

1. `bootstrap/dist/css/bootstrap.min.css`
2. Icon fonts (Bootstrap Icons, Remix Icon)
3. `styles/variables.css` — design tokens
4. `App.css` — global overrides and Bootstrap variable mapping
5. Component/page CSS imported by each module

Bootstrap JS bundle is loaded globally for sidebar collapse and other data-attribute behaviors.

## Theme system

Themes use `data-theme` and `data-bs-theme` on `<html>`:

- **Default:** dark (`:root` in `variables.css`)
- **Light:** `[data-theme='light']` override block

Toggle is in `Header.jsx` (moon icon). Both attributes must stay in sync so Bootstrap components respect the mode.

### CSS variables (`src/styles/variables.css`)

| Token | Usage |
|-------|--------|
| `--color-primary` | Links, accents, active nav |
| `--color-primary-dark` | Hover states |
| `--color-text` / `--color-text-muted` | Body and secondary text |
| `--color-bg` / `--color-bg-muted` | Page and panel backgrounds |
| `--color-border` | Dividers |
| `--transition-fast` | Hover animations |

`App.css` maps some tokens to Bootstrap (`--primary`, etc.). Prefer `var(--color-*)` in new page CSS for theme consistency.

## Page-level CSS

Colocate styles with features:

| File | Scope |
|------|--------|
| `components/header.css`, `sidebar.css` | Shell |
| `pages/accounts/accounts.css` | Account tree table |
| `pages/events/events.css` | Event workspace, entry cards |
| `pages/reports/reports.css` | Report tables, balanced badge |
| `components/app-dialog.css` | In-app confirm/alert |

Import page CSS in the page component (or parent), not in `main.jsx`, unless the styles are truly global.

## Layout

- **Header:** fixed top (`header.css`)
- **Sidebar:** fixed left (`sidebar.css`)
- **Main content:** `#main.main` offset for header/sidebar (`App.css`)

Use Bootstrap grid (`row`, `col-*`) and flex utilities (`d-flex`, `gap-*`) for page headers and filter cards.

## Tables and lists

- **Desktop:** `table table-striped` inside `table-responsive`
- **Mobile:** duplicate as card lists with `d-md-none` / `d-none d-md-block` where implemented (events list, account history)

Right-align numeric columns with `text-end` and `font-monospace` for amounts.

## Icons

Action buttons use Bootstrap Icons as modifier classes on buttons:

```html
<button className="btn btn-sm btn-secondary bi-eye" title="View"></button>
<button className="btn btn-sm btn-secondary bi-pencil" title="Edit"></button>
```

Always provide `title` (tooltip) on icon-only buttons. For disabled buttons that need tooltips, wrap in a `<span>` (disabled elements do not receive pointer events).

## Status badges

Consistent badge classes:

| Meaning | Classes |
|---------|---------|
| Posted / active / balanced | `badge text-bg-success` |
| Draft / inactive | `badge text-bg-secondary` |
| Out of balance | `badge text-bg-danger` |
| Neutral label | `badge text-bg-light` |

Reports use a slightly larger balanced badge (`.report-balanced-badge`).

## Account tree indentation

Expandable trees (accounts list, reports) share:

- `.account-tree-name` with `paddingLeft: depth * 1.25rem`
- Chevron toggle: `bi-chevron-right` / `bi-chevron-down`
- `.account-tree-spacer` for leaf alignment

Reuse these classes when adding new hierarchical tables.

## Best practices

- Do not add a CSS-in-JS library; stay with Bootstrap + small CSS files.
- Scope new rules to a page or component file; avoid growing `App.css` unless the rule is global.
- Use existing variables before hard-coding colors.
- Match spacing and button sizes (`btn-sm` in tables) of neighboring features.
- Test both light and dark themes when changing colors.
