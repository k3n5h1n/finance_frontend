const API_BASE =
  import.meta.env.VITE_ORG_SCOPED_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL;

export const ACCOUNTS_API = {
  LIST: `${API_BASE}/accounts/`,
  DETAIL: (id) => `${API_BASE}/accounts/${id}`,
  HISTORY: (id) => `${API_BASE}/accounts/${id}/history`,
};
