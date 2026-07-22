/**
 * Accounting API paths — confirm create/update URLs with backend (API Fairy) before wiring new calls.
 * Create routes use underscores and typically no trailing slash.
 */
const API_BASE =
  import.meta.env.VITE_ORG_SCOPED_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL;

export const EVENTS_API = {
  LIST: `${API_BASE}/accounting/events/`,
  DETAIL: (id) => `${API_BASE}/accounting/events/${id}`,
  /** PATCH post all draft entries in the event */
  POST: (id) => `${API_BASE}/accounting/events/${id}/post`,
  /** POST create entry group */
  ENTRY_GROUPS: (eventId) =>
    `${API_BASE}/accounting/events/${eventId}/entry_groups`,
  /** POST deep-copy event (optional body: include_line_resources, entries_date) */
  REPLICATE: (id) => `${API_BASE}/accounting/events/${id}/replicate`,
};

export const ENTRY_GROUPS_API = {
  DETAIL: (id) => `${API_BASE}/accounting/entry_groups/${id}/`,
  /** POST create entry */
  ENTRIES: (id) => `${API_BASE}/accounting/entry_groups/${id}/entries`,
  /** PATCH post all draft entries in the group */
  POST: (id) => `${API_BASE}/accounting/entry_groups/${id}/post`,
};

export const ENTRIES_API = {
  DETAIL: (id) => `${API_BASE}/accounting/entries/${id}/`,
  /** POST create entry line (nested resource is "entries") */
  LINES: (id) => `${API_BASE}/accounting/entries/${id}/entries`,
  /** PATCH post this entry */
  POST: (id) => `${API_BASE}/accounting/entries/${id}/post`,
};

export const ENTRY_LINES_API = {
  DETAIL: (id) => `${API_BASE}/accounting/entry_lines/${id}/`,
  /** POST create line resource */
  LINE_RESOURCES: (id) =>
    `${API_BASE}/accounting/entry_lines/${id}/line_resources`,
};

export const LINE_RESOURCES_API = {
  DETAIL: (id) => `${API_BASE}/accounting/line_resources/${id}/`,
};
