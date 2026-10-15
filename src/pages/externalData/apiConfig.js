const API_BASE =
  import.meta.env.VITE_ORG_SCOPED_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL;

export const EXTERNAL_APIS_API = {
  LIST: `${API_BASE}/external_apis/`,
  DETAIL: (id) => `${API_BASE}/external_apis/${id}`,
  TEST: (id, authorizationId) =>
    `${API_BASE}/external_apis/${id}/test?authorization_id=${encodeURIComponent(authorizationId)}`,
};
