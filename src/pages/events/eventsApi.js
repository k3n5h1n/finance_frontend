import {
  EVENTS_API,
  ENTRY_GROUPS_API,
  ENTRIES_API,
  ENTRY_LINES_API,
  LINE_RESOURCES_API,
} from "./apiConfig";
import { orgFetch } from "../../utils/orgRequest";
import { normalizePaginatedListResponse } from "../../utils/paginatedList";

async function parseResponseBody(res) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function formatApiError(data) {
  if (data == null) return null;
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item?.msg ?? item?.message ?? JSON.stringify(item))
      .join("; ");
  }
  if (data.messages?.json) {
    return Object.entries(data.messages.json)
      .map(([field, msgs]) =>
        `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`
      )
      .join("; ");
  }
  if (data.message) return data.message;
  if (data.error) return data.error;
  return null;
}

async function request(organizationId, url, options = {}, action) {
  const res = await orgFetch(url, options, organizationId);
  const data = await parseResponseBody(res);

  if (!res.ok) {
    const detail = formatApiError(data);
    throw new Error(
      `${action} (${res.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return data;
}

function jsonBody(payload) {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

async function postResource(organizationId, url, action) {
  return request(
    organizationId,
    url,
    { method: "PATCH", ...jsonBody({}) },
    action
  );
}

/** Replicate API expects Marshmallow DateTime, not the entry date string alone. */
function dateInputToDateTime(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return dateStr;
  return `${dateStr}T00:00:00`;
}

function buildEventsListQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.entries_start_on_or_after) {
    params.set("entries_start_on_or_after", filters.entries_start_on_or_after);
  }
  if (filters.entries_end_on_or_before) {
    params.set("entries_end_on_or_before", filters.entries_end_on_or_before);
  }
  const description = filters.description_contains?.trim();
  if (description) {
    params.set("description_contains", description);
  }
  if (filters.supplier_id != null && filters.supplier_id !== "") {
    params.set("supplier_id", String(filters.supplier_id));
  }
  if (filters.status === "draft" || filters.status === "posted") {
    params.set("status", filters.status);
  }
  if (filters.page_number != null) {
    params.set("page_number", String(filters.page_number));
  }
  if (filters.page_size != null) {
    params.set("page_size", String(filters.page_size));
  }
  return params;
}

export async function listEvents(organizationId, filters = {}) {
  const params = buildEventsListQuery(filters);
  const query = params.toString();
  const url = query ? `${EVENTS_API.LIST}?${query}` : EVENTS_API.LIST;

  const data = await request(
    organizationId,
    url,
    {},
    "Failed to load events"
  );
  return normalizePaginatedListResponse(data, ["results", "events"]);
}

export async function getEvent(organizationId, eventId) {
  return request(
    organizationId,
    EVENTS_API.DETAIL(eventId),
    {},
    "Failed to load event"
  );
}

export async function createEvent(organizationId, payload) {
  return request(
    organizationId,
    EVENTS_API.LIST,
    { method: "POST", ...jsonBody(payload) },
    "Failed to create event"
  );
}

export async function updateEvent(organizationId, eventId, payload) {
  return request(
    organizationId,
    EVENTS_API.DETAIL(eventId),
    { method: "PATCH", ...jsonBody(payload) },
    "Failed to update event"
  );
}

export async function deleteEvent(organizationId, eventId) {
  return request(
    organizationId,
    EVENTS_API.DETAIL(eventId),
    { method: "DELETE" },
    "Failed to delete event"
  );
}

export async function replicateEvent(organizationId, eventId, options = {}) {
  const payload = {};
  if (typeof options.include_line_resources === "boolean") {
    payload.include_line_resources = options.include_line_resources;
  }
  if (options.entries_date) {
    payload.entries_date = dateInputToDateTime(options.entries_date);
  }

  return request(
    organizationId,
    EVENTS_API.REPLICATE(eventId),
    { method: "POST", ...jsonBody(payload) },
    "Failed to replicate event"
  );
}

export async function createEntryGroup(organizationId, eventId, payload) {
  return request(
    organizationId,
    EVENTS_API.ENTRY_GROUPS(eventId),
    { method: "POST", ...jsonBody(payload) },
    "Failed to create entry group"
  );
}

export async function updateEntryGroup(organizationId, entryGroupId, payload) {
  return request(
    organizationId,
    ENTRY_GROUPS_API.DETAIL(entryGroupId),
    { method: "PATCH", ...jsonBody(payload) },
    "Failed to update entry group"
  );
}

export async function deleteEntryGroup(organizationId, entryGroupId) {
  return request(
    organizationId,
    ENTRY_GROUPS_API.DETAIL(entryGroupId),
    { method: "DELETE" },
    "Failed to delete entry group"
  );
}

export async function createEntry(organizationId, entryGroupId, payload) {
  return request(
    organizationId,
    ENTRY_GROUPS_API.ENTRIES(entryGroupId),
    { method: "POST", ...jsonBody(payload) },
    "Failed to create entry"
  );
}

export async function updateEntry(organizationId, entryId, payload) {
  return request(
    organizationId,
    ENTRIES_API.DETAIL(entryId),
    { method: "PATCH", ...jsonBody(payload) },
    "Failed to update entry"
  );
}

export async function postEntry(organizationId, entryId) {
  return postResource(
    organizationId,
    ENTRIES_API.POST(entryId),
    "Failed to post entry"
  );
}

export async function postEntryGroup(organizationId, entryGroupId) {
  return postResource(
    organizationId,
    ENTRY_GROUPS_API.POST(entryGroupId),
    "Failed to post entry group"
  );
}

export async function postEvent(organizationId, eventId) {
  return postResource(
    organizationId,
    EVENTS_API.POST(eventId),
    "Failed to post event"
  );
}

export async function deleteEntry(organizationId, entryId) {
  return request(
    organizationId,
    ENTRIES_API.DETAIL(entryId),
    { method: "DELETE" },
    "Failed to delete entry"
  );
}

export async function createEntryLine(organizationId, entryId, payload) {
  return request(
    organizationId,
    ENTRIES_API.LINES(entryId),
    { method: "POST", ...jsonBody(payload) },
    "Failed to create entry line"
  );
}

export async function updateEntryLine(organizationId, entryLineId, payload) {
  return request(
    organizationId,
    ENTRY_LINES_API.DETAIL(entryLineId),
    { method: "PATCH", ...jsonBody(payload) },
    "Failed to update entry line"
  );
}

export async function deleteEntryLine(organizationId, entryLineId) {
  return request(
    organizationId,
    ENTRY_LINES_API.DETAIL(entryLineId),
    { method: "DELETE" },
    "Failed to delete entry line"
  );
}

export async function createLineResource(organizationId, entryLineId, payload) {
  return request(
    organizationId,
    ENTRY_LINES_API.LINE_RESOURCES(entryLineId),
    { method: "POST", ...jsonBody(payload) },
    "Failed to create line resource"
  );
}

export async function updateLineResource(organizationId, lineResourceId, payload) {
  return request(
    organizationId,
    LINE_RESOURCES_API.DETAIL(lineResourceId),
    { method: "PATCH", ...jsonBody(payload) },
    "Failed to update line resource"
  );
}

export async function deleteLineResource(organizationId, lineResourceId) {
  return request(
    organizationId,
    LINE_RESOURCES_API.DETAIL(lineResourceId),
    { method: "DELETE" },
    "Failed to delete line resource"
  );
}
