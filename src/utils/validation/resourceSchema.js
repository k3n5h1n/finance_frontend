import { z } from "zod";

export const RESOURCE_TYPES = ["ITEM", "INSTRUMENT", "SERVICE", "PROPERTY"];

export const INSTRUMENT_TYPES = [
  "stock",
  "bond",
  "etf",
  "mutual fund",
  "index",
];

export const INSTRUMENT_CURRENCIES = ["CAD", "USD"];

export function formatResourceType(type) {
  if (!type) return "";
  return String(type)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatInstrumentType(type) {
  if (!type) return "";
  const labels = {
    stock: "Stock",
    bond: "Bond",
    etf: "ETF",
    "mutual fund": "Mutual fund",
    index: "Index",
  };
  return labels[type] ?? String(type);
}

/** Form-facing schema: keep string/empty values for inputs (no transforms). */
export const resourceSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(RESOURCE_TYPES, { message: "Type is required" }),
    is_active: z.boolean(),
    tracks_quantity: z.boolean(),
    default_units: z.string(),
    instrument_symbol: z.string(),
    instrument_type: z.string(),
    instrument_currency: z.string(),
    instrument_market_api_id: z.string(),
    instrument_date_listed: z.string(),
    instrument_date_delisted: z.string(),
    instrument_isin: z.string(),
    instrument_cusip: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "ITEM" && data.tracks_quantity == null) {
      ctx.addIssue({
        code: "custom",
        path: ["tracks_quantity"],
        message: "Tracks quantity is required for items",
      });
    }

    if (data.type !== "INSTRUMENT") return;

    if (!data.instrument_symbol?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["instrument_symbol"],
        message: "Symbol is required",
      });
    }
    if (!INSTRUMENT_TYPES.includes(data.instrument_type)) {
      ctx.addIssue({
        code: "custom",
        path: ["instrument_type"],
        message: "Instrument type is required",
      });
    }
    if (!INSTRUMENT_CURRENCIES.includes(data.instrument_currency)) {
      ctx.addIssue({
        code: "custom",
        path: ["instrument_currency"],
        message: "Currency is required",
      });
    }

    const marketApiId = data.instrument_market_api_id?.trim();
    if (marketApiId) {
      const parsed = Number(marketApiId);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["instrument_market_api_id"],
          message: "Market API ID must be a positive integer",
        });
      }
    }

    if (
      data.instrument_date_listed &&
      data.instrument_date_delisted &&
      data.instrument_date_delisted < data.instrument_date_listed
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["instrument_date_delisted"],
        message: "Delisted date must be on or after listed date",
      });
    }
  });

export function resourceToFormValues(resource) {
  const instrument = resource?.instrument;
  return {
    name: resource?.name ?? "",
    type: resource?.type ?? "ITEM",
    is_active: resource?.is_active ?? true,
    tracks_quantity: resource?.item?.tracks_quantity ?? false,
    default_units: resource?.item?.default_units ?? "",
    instrument_symbol: instrument?.symbol ?? "",
    instrument_type: instrument?.type ?? "",
    instrument_currency: instrument?.currency ?? "CAD",
    instrument_market_api_id:
      instrument?.market_api_id != null ? String(instrument.market_api_id) : "",
    instrument_date_listed: instrument?.date_listed ?? "",
    instrument_date_delisted: instrument?.date_delisted ?? "",
    instrument_isin: instrument?.isin ?? "",
    instrument_cusip: instrument?.cusip ?? "",
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
    if (data.default_units?.trim()) {
      payload.item.default_units = data.default_units.trim();
    }
  }

  if (data.type === "INSTRUMENT") {
    const instrument = {
      symbol: data.instrument_symbol.trim(),
      type: data.instrument_type,
      currency: data.instrument_currency,
    };
    const marketApiId = data.instrument_market_api_id?.trim();
    if (marketApiId) {
      instrument.market_api_id = Number(marketApiId);
    }
    if (data.instrument_date_listed) {
      instrument.date_listed = data.instrument_date_listed;
    }
    if (data.instrument_date_delisted) {
      instrument.date_delisted = data.instrument_date_delisted;
    }
    if (data.instrument_isin?.trim()) {
      instrument.isin = data.instrument_isin.trim();
    }
    if (data.instrument_cusip?.trim()) {
      instrument.cusip = data.instrument_cusip.trim();
    }
    payload.instrument = instrument;
  }

  return payload;
}

/** Short details line for the resources list. */
export function formatResourceDetails(resource) {
  if (resource?.type === "ITEM") {
    const parts = [
      resource.item?.tracks_quantity
        ? "Tracks quantity"
        : "No quantity tracking",
    ];
    if (resource.item?.default_units) {
      parts.push(resource.item.default_units);
    }
    return parts.join(" · ");
  }

  if (resource?.type === "INSTRUMENT") {
    const instrument = resource.instrument;
    if (!instrument) return "—";
    const parts = [];
    if (instrument.symbol) parts.push(instrument.symbol);
    if (instrument.type) parts.push(formatInstrumentType(instrument.type));
    if (instrument.currency) parts.push(instrument.currency);
    return parts.length > 0 ? parts.join(" · ") : "—";
  }

  return "—";
}
