/** Ledger row order: date, then description, then event id. */
export function compareHistoryRows(a, b) {
  const dateCmp = (a.date ?? "").localeCompare(b.date ?? "");
  if (dateCmp !== 0) return dateCmp;

  const descCmp = (a.event_description ?? "").localeCompare(
    b.event_description ?? "",
    undefined,
    { sensitivity: "base" }
  );
  if (descCmp !== 0) return descCmp;

  return (a.event_id ?? 0) - (b.event_id ?? 0);
}

export function sortAccountHistory(rows) {
  return [...(rows ?? [])].sort(compareHistoryRows);
}

/** Recompute balance after sort; backend running_total assumes its own order. */
export function withRunningTotals(rows) {
  let running = 0;

  return rows.map((row) => {
    const debit = Number(row.debit) || 0;
    const credit = Number(row.credit) || 0;
    running += debit - credit;
    return { ...row, running_total: running };
  });
}

export function normalizeAccountHistory(rows) {
  return withRunningTotals(sortAccountHistory(rows));
}
