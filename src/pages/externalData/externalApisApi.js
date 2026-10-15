import { EXTERNAL_APIS_API } from "./apiConfig";
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

function formatApiError(data, status) {
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
  if (status === 405) {
    return "This operation is not supported by the API on this endpoint.";
  }
  return null;
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.external_apis)) return data.external_apis;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function request(organizationId, url, options, action) {
  const res = await orgFetch(url, options, organizationId);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const detail = formatApiError(data, res.status);
    throw new Error(
      `${action} (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return data;
}

export async function listExternalApis(organizationId) {
  const data = await request(
    organizationId,
    EXTERNAL_APIS_API.LIST,
    {},
    "Failed to load external data sources"
  );
  return normalizeListResponse(data);
}

export async function getExternalApi(organizationId, id) {
  return request(
    organizationId,
    EXTERNAL_APIS_API.DETAIL(id),
    {},
    "Failed to load external data source"
  );
}

export async function createExternalApi(organizationId, payload) {
  return request(
    organizationId,
    EXTERNAL_APIS_API.LIST,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to create external data source"
  );
}

export async function updateExternalApi(organizationId, id, payload) {
  return request(
    organizationId,
    EXTERNAL_APIS_API.DETAIL(id),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to update external data source"
  );
}

export async function deleteExternalApi(organizationId, id) {
  return request(
    organizationId,
    EXTERNAL_APIS_API.DETAIL(id),
    { method: "DELETE" },
    "Failed to delete external data source"
  );
}

/** Returns true when the authorization responds 200; throws on error. */
export async function testExternalApiAuthorization(
  organizationId,
  externalApiId,
  authorizationId
) {
  return request(
    organizationId,
    EXTERNAL_APIS_API.TEST(externalApiId, authorizationId),
    {},
    "Authorization test failed"
  );
}
