import { z } from "zod";

export const lineResourceSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit_measure: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" || val == null ? null : val)),
  unit_amount: z.coerce
    .number({ error: "Unit cost is required" })
    .refine((val) => val !== 0, "Unit cost cannot be zero"),
});

export function lineResourceToFormValues(resource, defaults) {
  if (!resource) {
    return {
      description: defaults?.description ?? "",
      quantity: defaults?.quantity ?? 1,
      unit_measure: defaults?.unit_measure ?? "",
      unit_amount: defaults?.unit_amount ?? "",
    };
  }

  return {
    description: resource.description ?? "",
    quantity: resource.quantity ?? 1,
    unit_measure: resource.unit_measure ?? "",
    unit_amount: resource.unit_amount ?? "",
  };
}

export function formValuesToLineResourcePayload(data, { displayOrder } = {}) {
  const quantity = data.quantity;
  const unit_amount = data.unit_amount;
  const extended_amount = Math.round(quantity * unit_amount * 100) / 100;

  const payload = {
    description: data.description,
    quantity,
    unit_amount,
    extended_amount,
  };

  if (data.unit_measure) {
    payload.unit_measure = data.unit_measure;
  }

  if (displayOrder != null) {
    payload.display_order = displayOrder;
  }

  return payload;
}

/** Full PATCH body from an existing line resource (e.g. reorder). */
export function lineResourceToUpdatePayload(resource) {
  return formValuesToLineResourcePayload(
    {
      description: resource.description,
      quantity: resource.quantity,
      unit_measure: resource.unit_measure ?? "",
      unit_amount: resource.unit_amount,
    },
    { displayOrder: resource.display_order }
  );
}
