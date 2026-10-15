import { z } from "zod";

export const ACCOUNT_TYPES = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
];

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  currency: z.string().min(1, "Currency is required"),
  active: z.boolean(),
  type: z.string().min(1, "Type is required"),
  organization_id: z.coerce
    .number()
    .int()
    .positive("Organization is required"),
  parent_id: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val === "" || val == null ? null : Number(val))),
  owner_id: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => (val === "" || val == null ? null : Number(val))),
});

export function accountToFormValues(account, defaultOrganizationId) {
  return {
    name: account?.name ?? "",
    description: account?.description ?? "",
    currency: account?.currency ?? "CAD",
    active: account?.active ?? true,
    type: account?.type ?? "expense",
    organization_id: account?.organization?.id ?? defaultOrganizationId ?? "",
    parent_id: account?.parent?.id ?? "",
    owner_id: account?.owner?.id != null ? String(account.owner.id) : "",
  };
}

export function formValuesToPayload(data) {
  const payload = {
    name: data.name,
    currency: data.currency,
    active: data.active,
    type: data.type,
    owner_id: data.owner_id ?? null,
  };

  if (data.description) {
    payload.description = data.description;
  }

  if (data.parent_id != null) {
    payload.parent_account_id = data.parent_id;
  }

  return payload;
}
