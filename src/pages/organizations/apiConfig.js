// src/pages/organizations/apiConfig.js

const API_BASE = import.meta.env.VITE_API_BASE_URL;

console.log("apiConfig.js env:", import.meta.env.VITE_API_URL);


export const ORG_API = {
  LIST: `${API_BASE}/groups/`,          // GET all, POST new
  DETAIL: (id) => `${API_BASE}/groups/${id}`, // GET, PUT, DELETE
};

