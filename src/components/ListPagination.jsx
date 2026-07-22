import "./list-pagination.css";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function ListPagination({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  disabled = false,
  idPrefix = "list-pagination",
}) {
  const safePageNumber = Math.max(1, pageNumber || 1);
  const safePageSize = Math.max(1, pageSize || 1);
  const safeTotalPages = Math.max(1, totalPages || 1);
  const rangeStart =
    totalCount === 0 ? 0 : (safePageNumber - 1) * safePageSize + 1;
  const rangeEnd = Math.min(safePageNumber * safePageSize, totalCount);

  const canGoPrev = safePageNumber > 1 && !disabled;
  const canGoNext = safePageNumber < safeTotalPages && !disabled;

  return (
    <div className="list-pagination d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3">
      <div className="text-muted small">
        {totalCount === 0
          ? "No results"
          : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`}
      </div>

      <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 small text-nowrap" htmlFor={`${idPrefix}-size`}>
            Per page
          </label>
          <select
            id={`${idPrefix}-size`}
            className="form-select form-select-sm list-pagination-size"
            value={safePageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {safeTotalPages > 1 && (
          <nav aria-label="Pagination">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${canGoPrev ? "" : "disabled"}`}>
                <button
                  type="button"
                  className="page-link"
                  disabled={!canGoPrev}
                  onClick={() => onPageChange(safePageNumber - 1)}
                >
                  Previous
                </button>
              </li>
              <li className="page-item disabled">
                <span className="page-link">
                  Page {safePageNumber} of {safeTotalPages}
                </span>
              </li>
              <li className={`page-item ${canGoNext ? "" : "disabled"}`}>
                <button
                  type="button"
                  className="page-link"
                  disabled={!canGoNext}
                  onClick={() => onPageChange(safePageNumber + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
