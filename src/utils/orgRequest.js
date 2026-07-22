let activeOrganizationId = null;

const ORG_ID_HEADER =
  import.meta.env.VITE_ORG_ID_HEADER ?? "X-Organization-Id";

export function setActiveOrganizationId(id) {
  activeOrganizationId = id;
}

export function getActiveOrganizationId() {
  return activeOrganizationId;
}

/** Fetch wrapper that attaches the required organization header. */
export async function orgFetch(
  url,
  options = {},
  organizationId = activeOrganizationId
) {
  if (organizationId == null) {
    throw new Error("Organization not selected");
  }

  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");
  headers.set(ORG_ID_HEADER, String(organizationId));

  try {
    return await fetch(url, { ...options, headers });
  } catch {
    throw new Error(
      `Network error calling ${url}. In development, API calls should use the Vite proxy (VITE_API_BASE_URL=/api). Ensure the backend is running and API_PROXY_TARGET points to it.`
    );
  }
}
