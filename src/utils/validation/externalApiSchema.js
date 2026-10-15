import { z } from "zod";

export const EXTERNAL_API_TYPES = ["BANKING", "INVESTING", "WEATHER"];

export const EXTERNAL_API_PROVIDERS = ["QUESTRADE"];

export function formatExternalApiType(type) {
  if (!type) return "";
  return String(type)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatExternalApiProvider(provider) {
  if (!provider) return "";
  return String(provider)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export const externalApiSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(EXTERNAL_API_TYPES, { message: "Type is required" }),
  provider: z.enum(EXTERNAL_API_PROVIDERS, { message: "Provider is required" }),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  authorization_required: z.boolean(),
});

export function externalApiToFormValues(externalApi) {
  return {
    name: externalApi?.name ?? "",
    type: externalApi?.type ?? "INVESTING",
    provider: externalApi?.provider ?? "QUESTRADE",
    description: externalApi?.description ?? "",
    authorization_required: externalApi?.authorization_required ?? true,
  };
}

export function formValuesToExternalApiPayload(data) {
  const payload = {
    name: data.name,
    type: data.type,
    provider: data.provider,
    authorization_required: data.authorization_required,
  };

  if (data.description) {
    payload.description = data.description;
  }

  return payload;
}
