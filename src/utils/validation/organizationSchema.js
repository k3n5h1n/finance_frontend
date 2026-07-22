import { z } from "zod";

export const ORGANIZATION_TYPES = ["family", "business", "charity"];

export const organizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  description: z
    .string()
    .max(255, "Description cannot exceed 255 characters")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  type: z.string().min(1, "Type is required"),
});

export function organizationToFormValues(organization) {
  return {
    name: organization?.name ?? "",
    description: organization?.description ?? "",
    type: organization?.type ?? "family",
  };
}

export function formValuesToPayload(data) {
  const payload = {
    name: data.name,
    type: data.type,
  };

  if (data.description) {
    payload.description = data.description;
  }

  return payload;
}

export function formatOrganizationMembers(organization) {
  const names = (organization?.persons ?? [])
    .map((entry) => entry.person?.name)
    .filter(Boolean);

  return names.length > 0 ? names.join(", ") : "—";
}
