# Forms and validation

## Stack

- **React Hook Form** — form state, registration, submit handling
- **Zod** — schema validation
- **`@hookform/resolvers/zod`** — `zodResolver` bridge

Modals own the form; list/workspace pages own fetch orchestration and pass `onClose(saved)`.

## File layout

Schemas live in `src/utils/validation/`:

```
eventSchema.js
entrySchema.js
entryLineSchema.js
entryGroupSchema.js
lineItemSchema.js
accountSchema.js
supplierSchema.js
personSchema.js
organizationSchema.js
```

Each file typically exports:

| Export | Purpose |
|--------|---------|
| `*Schema` | Zod object for the form |
| `*ToFormValues(record)` | API/default → form fields |
| `formValuesToCreatePayload(data)` | Form → POST body |
| `formValuesToUpdatePayload(data, existing)` | Form → PATCH body (include server fields) |

Keep API payload shaping in the schema file, not in the modal component.

## Modal form pattern

```javascript
const { register, handleSubmit, reset, formState: { errors, isSubmitting, isValid, isDirty } } =
  useForm({
    resolver: zodResolver(entrySchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: entryToFormValues(null),
  });

useEffect(() => {
  if (isOpen) reset(entryToFormValues(isEdit ? entry : null));
}, [isOpen, isEdit, entry, reset]);

const onSubmit = async (data) => {
  try {
    await updateEntry(orgId, entry.id, formValuesToEntryPayload(data, { ... }));
    onClose(true);
  } catch (err) {
    await alert({ title: "Save failed", message: err.message, confirmVariant: "danger" });
  }
};
```

### UX conventions

- **Create:** submit enabled when `isValid` (dirty optional).
- **Edit:** submit enabled when `isDirty && isValid`.
- Bootstrap validation classes: `is-invalid` / `is-valid` on fields when appropriate.
- Icon footer buttons: `bi-x-circle` cancel, `bi-save` submit (matches existing modals).
- Reset form when modal opens via `useEffect` + `reset()`.

## Zod tips used in this project

- `z.coerce.number()` for numeric inputs
- Optional nullable strings with `.transform(val => val === "" ? null : val)` for optional API nulls
- `z.enum([...])` for fixed sets (account type, entry group type)
- Custom error messages on constraints (`min(1, "Description is required")`)

## Marshmallow alignment

Backend validation errors return as `messages.json`:

```json
{ "messages": { "json": { "display_order": ["Missing data for required field."] } } }
```

`formatApiError` in API modules surfaces these in thrown `Error` messages. Schema rules should match backend required fields to fail fast client-side.

### Common backend requirements

- **PATCH** often needs full object including `display_order`, `is_posted` (for entry metadata edits)
- **Posting** uses `PATCH …/post` endpoints — do not set `is_posted: true` via entry PATCH to post
- **Dates** as `YYYY-MM-DD` strings for date fields
- **Datetimes** as ISO strings with time component when Marshmallow expects DateTime
- **Clear optional FK:** send `null` explicitly (e.g. `supplier_id: null`)

## Organization default on create

Account (and similar) modals default `organization_id` to `selectedOrganizationId` from `useOrganization()` on add, not on edit.

## Delete flows

Destructive actions use `useAppDialog().confirm()` before API delete — not native `confirm()` except legacy organization/account delete in some API files (prefer migrating to `useAppDialog`).

## Adding a new form

1. Add `src/utils/validation/<entity>Schema.js` with schema + payload helpers.
2. Create `<Entity>Modal.jsx` following an existing modal (SupplierModal is a good simple example).
3. Wire API create/update in `*Api.js`.
4. Handle errors with `useAppDialog` alert inside the modal.
