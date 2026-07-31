import { z } from "zod";

export const RESOURCE_TYPES = ["ITEM", "INSTRUMENT", "SERVICE", "PROPERTY"];

export const resourceSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(RESOURCE_TYPES, { message: "Type is required" }),
    is_active: z.boolean(),
    tracks_quantity: z.boolean(),
    default_units: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === "" || val == null ? null : val)),
  })
  .superRefine((data, ctx) => {
    if (data.type === "ITEM" && data.tracks_quantity == null) {
      ctx.addIssue({
        code: "custom",
        path: ["tracks_quantity"],
        message: "Tracks quantity is required for items",
      });
    }
  });

export function formatResourceType(type) {
  if (!type) return "";
  return String(type)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function resourceToFormValues(resource) {
  return {
    name: resource?.name ?? "",
    type: resource?.type ?? "ITEM",
    is_active: resource?.is_active ?? true,
    tracks_quantity: resource?.item?.tracks_quantity ?? false,
    default_units: resource?.item?.default_units ?? "",
  };
}

export function formValuesToResourcePayload(data) {
  const payload = {
    name: data.name,
    type: data.type,
    is_active: data.is_active,
  };

  if (data.type === "ITEM") {
    payload.item = {
      tracks_quantity: Boolean(data.tracks_quantity),
    };
    if (data.default_units) {
      payload.item.default_units = data.default_units;
    }
  }

  return payload;
}
