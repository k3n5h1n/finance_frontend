import { RESOURCES_API } from "./apiConfig";
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

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.resources)) return data.resources;
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

export async function listResources(organizationId) {
  const data = await request(
    organizationId,
    RESOURCES_API.LIST,
    {},
    "Failed to load resources"
  );
  return normalizeListResponse(data);
}

export async function getResource(organizationId, id) {
  return request(
    organizationId,
    RESOURCES_API.DETAIL(id),
    {},
    "Failed to load resource"
  );
}

export async function createResource(organizationId, payload) {
  return request(
    organizationId,
    RESOURCES_API.LIST,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to create resource"
  );
}

export async function updateResource(organizationId, id, payload) {
  return request(
    organizationId,
    RESOURCES_API.DETAIL(id),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to update resource"
  );
}

export async function deleteResource(organizationId, id) {
  return request(
    organizationId,
    RESOURCES_API.DETAIL(id),
    { method: "DELETE" },
    "Failed to delete resource"
  );
}
