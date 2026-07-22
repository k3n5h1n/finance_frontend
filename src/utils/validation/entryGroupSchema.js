import { z } from "zod";

export const ENTRY_GROUP_TYPES = [
  "primary",
  "adjustment",
  "accrual",
  "reversal",
];

export const entryGroupSchema = z.object({
  description: z.string().min(1, "Description is required"),
  type: z.enum(ENTRY_GROUP_TYPES, { message: "Type is required" }),
});

export function entryGroupToFormValues(entryGroup) {
  return {
    description: entryGroup?.description ?? "",
    type: resolveEntryGroupType(entryGroup),
  };
}

export function getEntryGroupStoredType(entryGroup) {
  const raw = entryGroup?.type ?? entryGroup?.entry_group_type;
  if (!raw) return null;
  const normalized = String(raw).toLowerCase();
  return ENTRY_GROUP_TYPES.includes(normalized) ? normalized : null;
}

export function entryGroupHasStoredType(entryGroup) {
  return getEntryGroupStoredType(entryGroup) != null;
}

function resolveEntryGroupType(entryGroup) {
  return getEntryGroupStoredType(entryGroup) ?? "primary";
}

export function formValuesToEntryGroupPayload(data, entryGroup) {
  return {
    description: data.description,
    type: data.type,
    display_order: entryGroup.display_order,
  };
}

export function formValuesToCreateEntryGroupPayload(data, displayOrder) {
  return {
    description: data.description,
    type: data.type,
    display_order: displayOrder,
  };
}

/** Full PATCH body from an existing entry group (e.g. reorder). */
export function entryGroupToUpdatePayload(entryGroup) {
  return {
    description: entryGroup.description,
    type: resolveEntryGroupType(entryGroup),
    display_order: entryGroup.display_order,
  };
}

export function entryGroupCreateDefaults({ hasPrimary = false } = {}) {
  return {
    description: "",
    type: hasPrimary ? "adjustment" : "primary",
  };
}
