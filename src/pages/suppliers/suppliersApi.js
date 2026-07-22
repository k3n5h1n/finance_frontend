import { SUPPLIERS_API } from "./apiConfig";
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
  if (data.message) return data.message;
  if (data.error) return data.error;
  return null;
}

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.suppliers)) return data.suppliers;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function listSuppliers(organizationId) {
  const res = await orgFetch(SUPPLIERS_API.LIST, {}, organizationId);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const detail = formatApiError(data);
    throw new Error(
      `Failed to load suppliers for organization ${organizationId} (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return normalizeListResponse(data);
}

export async function getSupplier(organizationId, id) {
  const res = await orgFetch(SUPPLIERS_API.DETAIL(id), {}, organizationId);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const detail = formatApiError(data);
    throw new Error(
      `Failed to load supplier (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return data;
}

export async function createSupplier(organizationId, payload) {
  const res = await orgFetch(
    SUPPLIERS_API.LIST,
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
      `Failed to create supplier (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return parseResponseBody(res);
}

export async function updateSupplier(organizationId, id, payload) {
  const res = await orgFetch(
    SUPPLIERS_API.DETAIL(id),
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
      `Failed to update supplier (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return parseResponseBody(res);
}

export async function deleteSupplier(organizationId, id) {
  if (!confirm("Delete this supplier?")) return;

  const res = await orgFetch(
    SUPPLIERS_API.DETAIL(id),
    { method: "DELETE" },
    organizationId
  );

  if (!res.ok) {
    const data = await parseResponseBody(res);
    const detail = formatApiError(data);
    throw new Error(
      `Failed to delete supplier (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }
}
