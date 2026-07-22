import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  active: z.boolean(),
});

export function supplierToFormValues(supplier) {
  return {
    name: supplier?.name ?? "",
    description: supplier?.description ?? "",
    active: supplier?.active ?? true,
  };
}

export function formValuesToPayload(data) {
  const payload = {
    name: data.name,
    active: data.active,
  };

  if (data.description) {
    payload.description = data.description;
  }

  return payload;
}
