const API_BASE =
  import.meta.env.VITE_ORG_SCOPED_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL;

export const SUPPLIERS_API = {
  LIST: `${API_BASE}/suppliers/`,
  DETAIL: (id) => `${API_BASE}/suppliers/${id}`,
};
