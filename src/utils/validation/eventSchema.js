import { z } from "zod";

export const EVENT_STATUSES = ["draft", "posted"];

/** API accepts lowercase; backend maps to uppercase constants. */
export const EVENT_TYPES = ["normal", "opening_balance", "year_end_close"];

export const eventSchema = z.object({
  description: z.string().min(1, "Description is required"),
  type: z.enum(EVENT_TYPES, { message: "Type is required" }),
  is_external: z.boolean(),
});

export function resolveEventType(event) {
  const raw = event?.type;
  if (!raw) return "normal";
  const normalized = String(raw).toLowerCase();
  return EVENT_TYPES.includes(normalized) ? normalized : "normal";
}

export function eventToFormValues(event) {
  return {
    description: event?.description ?? "",
    type: resolveEventType(event),
    is_external: event?.is_external ?? true,
  };
}

export function formValuesToCreatePayload(data) {
  return {
    description: data.description,
    type: data.type,
    is_external: data.is_external,
    status: "draft",
  };
}

export function formValuesToUpdatePayload(data, event) {
  const payload = {
    description: data.description,
    type: data.type,
    is_external: data.is_external,
  };

  if (event?.status) {
    payload.status = event.status;
  }

  return payload;
}
