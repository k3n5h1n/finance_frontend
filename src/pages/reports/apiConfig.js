const API_BASE =
  import.meta.env.VITE_ORG_SCOPED_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL;

export const REPORTS_API = {
  INCOME_STATEMENT: `${API_BASE}/accounting/reports/income_statement/`,
  BALANCE_SHEET: `${API_BASE}/accounting/reports/balance_sheet/`,
};
