import {
  buildAccountTree,
  getAccountParentId,
} from "../accounts/accountTree";

export const FISCAL_YEAR_OPTIONS = [2025, 2026];

export function defaultFiscalYear() {
  const year = new Date().getFullYear();
  return FISCAL_YEAR_OPTIONS.includes(year)
    ? year
    : FISCAL_YEAR_OPTIONS[FISCAL_YEAR_OPTIONS.length - 1];
}

/** Current year plus prior year when available (descending). */
export function defaultFiscalYears() {
  const sortedDesc = [...FISCAL_YEAR_OPTIONS].sort((a, b) => b - a);
  const current = defaultFiscalYear();
  const index = sortedDesc.indexOf(current);
  if (index >= 0 && index < sortedDesc.length - 1) {
    return [sortedDesc[index], sortedDesc[index + 1]];
  }
  return [current];
}

export function balancesByAccountId(rows) {
  const map = new Map();
  for (const row of rows ?? []) {
    if (row.account?.id != null) {
      map.set(row.account.id, row.balance);
    }
  }
  return map;
}

export function multiBalancesByAccountId(rows) {
  const map = new Map();
  for (const row of rows ?? []) {
    if (row.account?.id != null) {
      map.set(row.account.id, row.balances ?? []);
    }
  }
  return map;
}

/**
 * Sort periods newest-first and reorder each row's balances[] to match.
 * API may return years in any order; UI columns are always descending.
 */
export function normalizeBalanceSheetReport(report) {
  const originalPeriods = report?.periods ?? [];
  if (originalPeriods.length === 0) {
    return {
      posted_only: report?.posted_only,
      periods: [],
      rows: report?.rows ?? [],
    };
  }

  const periods = [...originalPeriods].sort(
    (a, b) => Number(b.fiscal_year) - Number(a.fiscal_year)
  );
  const indexMap = periods.map((period) =>
    originalPeriods.findIndex((p) => p.fiscal_year === period.fiscal_year)
  );

  const rows = (report?.rows ?? []).map((row) => ({
    account: row.account,
    balances: indexMap.map((i) => row.balances?.[i] ?? "0"),
  }));

  return {
    posted_only: report?.posted_only,
    periods,
    rows,
  };
}

export function filterReportRowsByAccountType(rows, type) {
  const normalized = String(type).toLowerCase();
  return (rows ?? []).filter(
    (row) => row.account?.type?.toLowerCase() === normalized
  );
}

/** Merge report balances onto chart-of-accounts nodes and build a section tree. */
export function buildReportSectionTree(allAccounts, reportRows) {
  const balanceMap = balancesByAccountId(reportRows);
  if (balanceMap.size === 0) return [];

  const byId = new Map(allAccounts.map((account) => [account.id, account]));
  const includeIds = new Set();

  for (const accountId of balanceMap.keys()) {
    let current = byId.get(accountId);
    while (current) {
      includeIds.add(current.id);
      const parentId = getAccountParentId(current);
      current = parentId != null ? byId.get(parentId) : null;
    }
  }

  const sectionAccounts = [...includeIds]
    .map((id) => {
      const account = byId.get(id);
      if (!account) return null;
      return {
        ...account,
        reportBalance: balanceMap.get(id) ?? "0",
      };
    })
    .filter(Boolean);

  return buildAccountTree(sectionAccounts);
}

/** Multi-period variant: each node gets reportBalances[] aligned to periods. */
export function buildMultiPeriodReportSectionTree(allAccounts, reportRows) {
  const balanceMap = multiBalancesByAccountId(reportRows);
  if (balanceMap.size === 0) return [];

  const periodCount = Math.max(
    0,
    ...[...balanceMap.values()].map((balances) => balances.length)
  );
  const zeros = Array.from({ length: periodCount }, () => "0");

  const byId = new Map(allAccounts.map((account) => [account.id, account]));
  const includeIds = new Set();

  for (const accountId of balanceMap.keys()) {
    let current = byId.get(accountId);
    while (current) {
      includeIds.add(current.id);
      const parentId = getAccountParentId(current);
      current = parentId != null ? byId.get(parentId) : null;
    }
  }

  const sectionAccounts = [...includeIds]
    .map((id) => {
      const account = byId.get(id);
      if (!account) return null;
      const balances = balanceMap.get(id);
      return {
        ...account,
        reportBalances: balances?.length ? [...balances] : [...zeros],
      };
    })
    .filter(Boolean);

  return buildAccountTree(sectionAccounts);
}
