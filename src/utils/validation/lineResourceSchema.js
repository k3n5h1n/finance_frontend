import { z } from "zod";

export const lineResourceSchema = z
  .object({
    link_to_resource: z.boolean(),
    resource_type: z.literal("ITEM"),
    resource_id: z
      .union([z.coerce.number().int().positive(), z.literal(""), z.null()])
      .optional()
      .transform((val) => (val === "" || val == null ? null : Number(val))),
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce
      .number({ error: "Quantity is required" })
      .refine((val) => val !== 0, "Quantity cannot be zero"),
    unit_measure: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === "" || val == null ? null : val)),
    unit_amount: z.coerce
      .number({ error: "Unit cost is required" })
      .refine((val) => val !== 0, "Unit cost cannot be zero"),
  })
  .superRefine((data, ctx) => {
    if (data.link_to_resource && data.resource_id == null) {
      ctx.addIssue({
        code: "custom",
        path: ["resource_id"],
        message: "Select a resource",
      });
    }
  });

export function lineResourceToFormValues(resource, defaults) {
  const linkedId = resource?.resource_id ?? null;

  if (!resource) {
    return {
      link_to_resource: false,
      resource_type: "ITEM",
      resource_id: null,
      description: defaults?.description ?? "",
      quantity: defaults?.quantity ?? 1,
      unit_measure: defaults?.unit_measure ?? "",
      unit_amount: defaults?.unit_amount ?? "",
    };
  }

  return {
    link_to_resource: linkedId != null,
    resource_type: "ITEM",
    resource_id: linkedId,
    description: resource.description ?? "",
    quantity: resource.quantity ?? 1,
    unit_measure: resource.unit_measure ?? "",
    unit_amount: resource.unit_amount ?? "",
  };
}

export function formValuesToLineResourcePayload(data, { displayOrder } = {}) {
  const quantity = data.quantity;
  const unit_amount = data.unit_amount;
  const extended_amount =
    Math.round(Math.abs(quantity * unit_amount) * 100) / 100;

  const payload = {
    description: data.description,
    quantity,
    unit_amount,
    extended_amount,
    resource_id: data.link_to_resource ? data.resource_id : null,
  };

  if (data.unit_measure) {
    payload.unit_measure = data.unit_measure;
  } else {
    payload.unit_measure = null;
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
      link_to_resource: resource.resource_id != null,
      resource_id: resource.resource_id ?? null,
      description: resource.description,
      quantity: resource.quantity,
      unit_measure: resource.unit_measure ?? "",
      unit_amount: resource.unit_amount,
    },
    { displayOrder: resource.display_order }
  );
}
