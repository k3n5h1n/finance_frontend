import { z } from "zod";

const optionalId = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((val) => (val === "" || val == null ? null : Number(val)));

export const entryLineSchema = z
  .object({
    account_id: z.coerce.number().int().positive("Account is required"),
    supplier_id: optionalId,
    side: z.enum(["debit", "credit"], {
      required_error: "Select debit or credit",
    }),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
  })
  .transform((data) => ({
    account_id: data.account_id,
    debit: data.side === "debit" ? data.amount : 0,
    credit: data.side === "credit" ? data.amount : 0,
    supplier_id: data.supplier_id,
  }));

export function entryLineToFormValues(line, balancingDefaults) {
  if (!line) {
    const defaults = balancingDefaults ?? { side: "debit", amount: "" };
    return {
      account_id: "",
      supplier_id: "",
      side: defaults.side,
      amount: defaults.amount === "" ? "" : defaults.amount,
    };
  }

  const debit = line.debit ?? 0;
  const credit = line.credit ?? 0;

  return {
    account_id: line.account?.id ?? line.account_id ?? "",
    supplier_id: line.supplier?.id ?? line.supplier_id ?? "",
    side: debit > 0 ? "debit" : "credit",
    amount: debit > 0 ? debit : credit > 0 ? credit : "",
  };
}

export function formValuesToEntryLinePayload(data, { displayOrder } = {}) {
  const payload = { ...data };

  if (displayOrder != null) {
    payload.display_order = displayOrder;
  }

  return payload;
}

/** Full PATCH body from an existing entry line (e.g. reorder). */
export function entryLineToUpdatePayload(line) {
  const supplierId = line.supplier?.id ?? line.supplier_id;

  return {
    account_id: line.account?.id ?? line.account_id,
    debit: line.debit ?? 0,
    credit: line.credit ?? 0,
    supplier_id: supplierId ?? null,
    display_order: line.display_order,
  };
}
