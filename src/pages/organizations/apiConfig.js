const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const ORG_API = {
  LIST: `${API_BASE}/organizations/`,
  DETAIL: (id) => `${API_BASE}/organizations/${id}`,
};
