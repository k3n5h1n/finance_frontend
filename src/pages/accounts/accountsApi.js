import { ACCOUNTS_API } from "./apiConfig";
import { orgFetch } from "../../utils/orgRequest";

function normalizeAccountsResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.accounts)) return data.accounts;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

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
  if (data.message) return data.message;
  if (data.error) return data.error;
  return null;
}

export async function listAccounts(organizationId) {
  const res = await orgFetch(ACCOUNTS_API.LIST, {}, organizationId);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const detail = formatApiError(data);
    throw new Error(
      `Failed to load accounts for organization ${organizationId} (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return normalizeAccountsResponse(data);
}

export async function getAccount(organizationId, id) {
  const res = await orgFetch(ACCOUNTS_API.DETAIL(id), {}, organizationId);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const detail = formatApiError(data);
    throw new Error(
      `Failed to load account (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return data;
}

function normalizeHistoryResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.history)) return data.history;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function getAccountHistory(organizationId, accountId, options = {}) {
  const params = new URLSearchParams();
  if (options.start_date) params.set("start_date", options.start_date);
  if (options.end_date) params.set("end_date", options.end_date);
  if (options.page_number != null) {
    params.set("page_number", String(options.page_number));
  }
  if (options.page_size != null) {
    params.set("page_size", String(options.page_size));
  }

  const query = params.toString();
  const url = `${ACCOUNTS_API.HISTORY(accountId)}${query ? `?${query}` : ""}`;
  const res = await orgFetch(url, {}, organizationId);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const detail = formatApiError(data);
    throw new Error(
      `Failed to load account history (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return normalizeHistoryResponse(data);
}

export async function createAccount(organizationId, payload) {
  const res = await orgFetch(
    ACCOUNTS_API.LIST,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    organizationId
  );

  if (!res.ok) {
    const data = await parseResponseBody(res);
    const detail = formatApiError(data);
    throw new Error(
      `Failed to create account (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return parseResponseBody(res);
}

export async function updateAccount(organizationId, id, payload) {
  const res = await orgFetch(
    ACCOUNTS_API.DETAIL(id),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    organizationId
  );

  if (!res.ok) {
    const data = await parseResponseBody(res);
    const detail = formatApiError(data);
    throw new Error(
      `Failed to update account (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return parseResponseBody(res);
}

export async function deleteAccount(organizationId, id) {
  if (!confirm("Delete this account?")) return;

  const res = await orgFetch(
    ACCOUNTS_API.DETAIL(id),
    { method: "DELETE" },
    organizationId
  );

  if (!res.ok) {
    const data = await parseResponseBody(res);
    const detail = formatApiError(data);
    throw new Error(
      `Failed to delete account (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }
}
