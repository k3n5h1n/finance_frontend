/** Display helpers for investment list/detail. */

export function formatInvestmentType(type) {
  if (!type) return "—";
  return String(type);
}

export function formatInvestmentDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

/** Broker dates arrive as GMT midnight strings; keep the UTC calendar day. */
export function formatBrokerDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatBrokerAmount(amount) {
  return new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

export function formatInvestmentDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

/** Closed when date_closed is set; otherwise open. */
export function isInvestmentClosed(investment) {
  return Boolean(investment?.date_closed);
}

export function formatAccountLinkType(type) {
  if (!type) return "—";
  return String(type)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatPersonRole(role) {
  if (!role) return "—";
  return String(role)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** interest_fraction is 0–1; display as percent. */
export function formatInterestFraction(value) {
  if (value == null || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${(num * 100).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}%`;
}

export function sortInvestmentsDefault(investments) {
  return [...investments].sort((a, b) => {
    const closedDiff =
      Number(isInvestmentClosed(a)) - Number(isInvestmentClosed(b));
    if (closedDiff !== 0) return closedDiff;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
}
