/**
 * Helpers for syncing list filters and pagination to the URL (informational URLs).
 * Prefer these over component state so list → detail → back restores the same view.
 */

/**
 * @param {URLSearchParams} searchParams
 * @param {string} key
 * @param {string} [fallback]
 */
export function getSearchParam(searchParams, key, fallback = "") {
  return searchParams.get(key) ?? fallback;
}

/**
 * @param {URLSearchParams} searchParams
 * @param {string} key
 * @param {number} fallback
 */
export function getPositiveIntParam(searchParams, key, fallback) {
  const raw = searchParams.get(key);
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Merge updates into the current search string.
 * Empty values and values matching `defaults` are omitted so URLs stay clean.
 *
 * @param {import("react-router-dom").SetURLSearchParams} setSearchParams
 * @param {Record<string, string | number | null | undefined>} updates
 * @param {{ defaults?: Record<string, string | number>; replace?: boolean }} [options]
 */
export function patchListSearchParams(
  setSearchParams,
  updates,
  { defaults = {}, replace = true } = {}
) {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    for (const [key, value] of Object.entries(updates)) {
      const defaultValue = defaults[key];
      const isEmpty = value == null || value === "";
      const isDefault =
        defaultValue !== undefined && String(value) === String(defaultValue);
      if (isEmpty || isDefault) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    return next;
  }, { replace });
}

/**
 * Remove the given keys from the URL (e.g. Clear filters).
 *
 * @param {import("react-router-dom").SetURLSearchParams} setSearchParams
 * @param {string[]} keys
 * @param {{ replace?: boolean }} [options]
 */
export function clearListSearchParams(
  setSearchParams,
  keys,
  { replace = true } = {}
) {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    for (const key of keys) {
      next.delete(key);
    }
    return next;
  }, { replace });
}
