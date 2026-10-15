const API_BASE =
  import.meta.env.VITE_ORG_SCOPED_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL;

export const INVESTMENTS_API = {
  LIST: `${API_BASE}/investments/`,
  DETAIL: (id) => `${API_BASE}/investments/${id}`,
  BROKER_TRANSACTIONS: (id) => `${API_BASE}/investments/${id}/broker_transactions`,
};
