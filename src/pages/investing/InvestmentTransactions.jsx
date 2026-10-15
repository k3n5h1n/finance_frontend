import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useOrganization } from "../../context/OrganizationContext";
import { listBrokerTransactions } from "./investmentsApi";
import { formatBrokerAmount, formatBrokerDate } from "./investmentUtils";
import {
  getPositiveIntParam,
  patchListSearchParams,
} from "../../utils/listSearchParams";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const PAGE_PARAM_DEFAULTS = {
  page_number: DEFAULT_PAGE_NUMBER,
  page_size: DEFAULT_PAGE_SIZE,
};

function displaySymbol(symbol) {
  const trimmed = symbol?.trim();
  return trimmed ? trimmed : "—";
}

export default function InvestmentTransactions() {
  const { investmentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedOrganizationId } = useOrganization();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageNumber = getPositiveIntParam(
    searchParams,
    "page_number",
    DEFAULT_PAGE_NUMBER
  );
  const pageSize = getPositiveIntParam(
    searchParams,
    "page_size",
    DEFAULT_PAGE_SIZE
  );

  const patchParams = useCallback(
    (updates) => {
      patchListSearchParams(setSearchParams, updates, {
        defaults: PAGE_PARAM_DEFAULTS,
      });
    },
    [setSearchParams]
  );

  const loadTransactions = useCallback(async () => {
    if (selectedOrganizationId == null || investmentId == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await listBrokerTransactions(
        selectedOrganizationId,
        investmentId,
        { page_number: pageNumber, page_size: pageSize }
      );
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load broker transactions:", err);
      setTransactions([]);
      setError(err.message ?? "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId, investmentId, pageNumber, pageSize]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const hasMore = !loading && transactions.length === pageSize;
  const rangeStart =
    transactions.length === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const rangeEnd = (pageNumber - 1) * pageSize + transactions.length;

  return (
    <section className="card mb-4 investment-section-card">
      <div className="card-header">
        <h5 className="mb-0">Transactions</h5>
      </div>
      <div className="card-body">
        <div className="row g-3 mb-3">
          <div className="col-sm-4 col-md-3">
            <label className="form-label" htmlFor="investment-tx-from">
              From
            </label>
            <input
              id="investment-tx-from"
              type="date"
              className="form-control"
              disabled
              title="Date filters are not available yet"
            />
          </div>
          <div className="col-sm-4 col-md-3">
            <label className="form-label" htmlFor="investment-tx-to">
              To
            </label>
            <input
              id="investment-tx-to"
              type="date"
              className="form-control"
              disabled
              title="Date filters are not available yet"
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-striped mb-0 investment-section-table">
            <thead>
              <tr>
                <th>Trade date</th>
                <th>Settlement date</th>
                <th className="text-center">Type</th>
                <th>External account</th>
                <th>Symbol</th>
                <th className="text-end">Net amount</th>
                <th className="text-end">Event</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{formatBrokerDate(tx.trade_date)}</td>
                    <td>{formatBrokerDate(tx.settlement_date)}</td>
                    <td className="text-center">{tx.type || "—"}</td>
                    <td>{tx.external_account_id || "—"}</td>
                    <td>{displaySymbol(tx.symbol)}</td>
                    <td className="text-end font-monospace">
                      {formatBrokerAmount(tx.net_amount)}
                    </td>
                    <td className="text-end">
                      {tx.event_id != null ? (
                        <Link to={`/accounting/events/${tx.event_id}`}>
                          {tx.event_id}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3 mt-3">
          <div className="text-muted small">
            {transactions.length === 0
              ? "No results"
              : `Showing ${rangeStart}–${rangeEnd}`}
          </div>
          <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <label
                className="form-label mb-0 small text-nowrap"
                htmlFor="broker-tx-page-size"
              >
                Per page
              </label>
              <select
                id="broker-tx-page-size"
                className="form-select form-select-sm"
                style={{ width: "auto" }}
                value={pageSize}
                disabled={loading}
                onChange={(event) =>
                  patchParams({
                    page_size: Number(event.target.value),
                    page_number: DEFAULT_PAGE_NUMBER,
                  })
                }
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <nav aria-label="Transaction pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${pageNumber > 1 && !loading ? "" : "disabled"}`}>
                  <button
                    type="button"
                    className="page-link"
                    disabled={pageNumber <= 1 || loading}
                    onClick={() => patchParams({ page_number: pageNumber - 1 })}
                  >
                    Previous
                  </button>
                </li>
                <li className="page-item disabled">
                  <span className="page-link">Page {pageNumber}</span>
                </li>
                <li className={`page-item ${hasMore ? "" : "disabled"}`}>
                  <button
                    type="button"
                    className="page-link"
                    disabled={!hasMore || loading}
                    onClick={() => patchParams({ page_number: pageNumber + 1 })}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
