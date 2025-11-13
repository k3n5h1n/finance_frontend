// src/pages/organizations/apiConfig.js

const API_BASE = import.meta.env.VITE_API_BASE_URL;

console.log("apiConfig.js env:", import.meta.env.VITE_API_URL);


export const PEOPLE_API = {
  LIST: `${API_BASE}/persons/`,          // GET all, POST new
  DETAIL: (id) => `${API_BASE}/persons/${id}`, // GET, PUT, DELETE
};

