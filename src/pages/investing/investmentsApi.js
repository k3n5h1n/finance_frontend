import { INVESTMENTS_API } from "./apiConfig";
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
  if (typeof data === "string") {
    if (data.includes("<html") || data.includes("<!doctype")) {
      const titleMatch = data.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch?.[1]) return titleMatch[1];
      return "Request failed";
    }
    return data;
  }
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

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.investments)) return data.investments;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function request(organizationId, url, options, action) {
  const res = await orgFetch(url, options, organizationId);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const detail = formatApiError(data);
    throw new Error(
      `${action} (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return data;
}

export async function listInvestments(organizationId) {
  const data = await request(
    organizationId,
    INVESTMENTS_API.LIST,
    {},
    "Failed to load investments"
  );
  return normalizeListResponse(data);
}

export async function getInvestment(organizationId, id) {
  return request(
    organizationId,
    INVESTMENTS_API.DETAIL(id),
    {},
    "Failed to load investment"
  );
}

export async function listBrokerTransactions(
  organizationId,
  investmentId,
  { page_number, page_size } = {}
) {
  const params = new URLSearchParams();
  if (page_number != null) params.set("page_number", String(page_number));
  if (page_size != null) params.set("page_size", String(page_size));
  const query = params.toString();
  const url = query
    ? `${INVESTMENTS_API.BROKER_TRANSACTIONS(investmentId)}?${query}`
    : INVESTMENTS_API.BROKER_TRANSACTIONS(investmentId);

  const data = await request(
    organizationId,
    url,
    {},
    "Failed to load broker transactions"
  );
  return normalizeListResponse(data);
}
