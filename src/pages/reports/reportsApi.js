import { REPORTS_API } from "./apiConfig";
import { orgFetch } from "../../utils/orgRequest";

async function parseResponseBody(res) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function formatApiError(data) {
  if (data == null) return null;
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item?.msg ?? item?.message ?? JSON.stringify(item))
      .join("; ");
  }
  if (data.messages?.json) {
    return Object.entries(data.messages.json)
      .map(([field, msgs]) =>
        `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`
      )
      .join("; ");
  }
  if (data.message) return data.message;
  if (data.error) return data.error;
  return null;
}

function buildReportQueryParams(options = {}) {
  const params = new URLSearchParams();
  if (Array.isArray(options.fiscal_years) && options.fiscal_years.length > 0) {
    for (const year of options.fiscal_years) {
      if (year != null && year !== "") {
        params.append("fiscal_years", String(year));
      }
    }
  } else if (options.fiscal_year != null) {
    params.set("fiscal_year", String(options.fiscal_year));
  }
  if (typeof options.posted_only === "boolean") {
    params.set("posted_only", String(options.posted_only));
  }
  return params;
}

async function fetchReport(url, organizationId, options, action) {
  const params = buildReportQueryParams(options);
  const query = params.toString();
  const requestUrl = `${url}${query ? `?${query}` : ""}`;
  const res = await orgFetch(requestUrl, {}, organizationId);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const detail = formatApiError(data);
    throw new Error(
      `${action} (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return data;
}

export async function getIncomeStatement(organizationId, options = {}) {
  return fetchReport(
    REPORTS_API.INCOME_STATEMENT,
    organizationId,
    options,
    "Failed to load income statement"
  );
}

export async function getBalanceSheet(organizationId, options = {}) {
  return fetchReport(
    REPORTS_API.BALANCE_SHEET,
    organizationId,
    options,
    "Failed to load balance sheet"
  );
}
