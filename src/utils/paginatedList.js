const DEFAULT_RESULT_KEYS = ["results", "events", "data"];

function extractResults(data, resultKeys) {
  if (Array.isArray(data)) return data;
  for (const key of resultKeys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

/** Normalize list API responses that may be a bare array or a paginated envelope. */
export function normalizePaginatedListResponse(
  data,
  resultKeys = DEFAULT_RESULT_KEYS
) {
  const results = extractResults(data, resultKeys);

  if (Array.isArray(data)) {
    return {
      results,
      page_number: 1,
      page_size: results.length || 1,
      total_count: results.length,
      total_pages: 1,
    };
  }

  return {
    results,
    page_number: Number(data?.page_number) || 1,
    page_size: Number(data?.page_size) || results.length || 1,
    total_count: Number(data?.total_count ?? results.length),
    total_pages: Number(data?.total_pages) || 1,
  };
}
