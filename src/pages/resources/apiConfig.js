const API_BASE =
  import.meta.env.VITE_ORG_SCOPED_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL;

export const RESOURCES_API = {
  LIST: `${API_BASE}/resources/`,
  DETAIL: (id) => `${API_BASE}/resources/${id}`,
};
