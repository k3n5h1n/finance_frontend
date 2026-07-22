import { z } from "zod";

export const entrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
});

function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function entryToFormValues(entry) {
  return {
    date: entry?.date ?? todayISO(),
    description: entry?.description ?? "",
  };
}

export function formValuesToEntryPayload(data, { displayOrder, isPosted = false } = {}) {
  const payload = {
    date: data.date,
    description: data.description,
    is_posted: isPosted,
  };

  if (displayOrder != null) {
    payload.display_order = displayOrder;
  }

  return payload;
}

/** Full PATCH body from an existing entry (e.g. reorder). */
export function entryToUpdatePayload(entry) {
  return {
    date: entry.date,
    description: entry.description,
    is_posted: Boolean(entry.is_posted),
    display_order: entry.display_order,
  };
}
