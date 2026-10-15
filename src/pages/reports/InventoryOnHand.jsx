import { useState, useEffect, useCallback, useMemo } from "react";
import { useOrganization } from "../../context/OrganizationContext";
import { getInventoryOnHand } from "./reportsApi";
import { formatAmount } from "../events/eventUtils";
import "./reports.css";

const AS_OF_DATE_DEBOUNCE_MS = 400;

function formatQuantity(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-CA", {
    maximumFractionDigits: 4,
  }).format(amount);
}

function formatAverageCost(value) {
  if (value == null || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

function formatTotalCost(value) {
  if (value == null || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return formatAmount(amount);
}

function isCompleteDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function InventoryOnHand() {
  const { selectedOrganizationId } = useOrganization();
  const [items, setItems] = useState([]);
  const [postedOnly, setPostedOnly] = useState(false);
  const [asOfDate, setAsOfDate] = useState("");
  const [debouncedAsOfDate, setDebouncedAsOfDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      // Only query once the field is blank or a full YYYY-MM-DD value.
      if (asOfDate === "" || isCompleteDate(asOfDate)) {
        setDebouncedAsOfDate(asOfDate);
      }
    }, AS_OF_DATE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [asOfDate]);

  const loadReport = useCallback(async () => {
    if (selectedOrganizationId == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getInventoryOnHand(selectedOrganizationId, {
        posted_only: postedOnly,
        as_of_date: debouncedAsOfDate || undefined,
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("Failed to load inventory on-hand:", err);
      setItems([]);
      setError(err.message ?? "Failed to load inventory on-hand report.");
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId, postedOnly, debouncedAsOfDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        String(a.resource_name ?? "").localeCompare(String(b.resource_name ?? ""))
      ),
    [items]
  );

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <h3 className="mb-0">Inventory On-Hand</h3>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-start">
            <div className="col-sm-4 col-md-3">
              <label className="form-label" htmlFor="inventory-as-of-date">
                As of date
              </label>
              <input
                id="inventory-as-of-date"
                type="date"
                className="form-control"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
              <div className="form-text">Leave blank for current on-hand.</div>
            </div>
            <div className="col-sm-4 col-md-3">
              <label className="form-label" htmlFor="inventory-posted-only">
                Posted only
              </label>
              <div className="form-check report-filter-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="inventory-posted-only"
                  checked={postedOnly}
                  onChange={(e) => setPostedOnly(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : loading ? (
        <p className="text-muted mb-0">Loading...</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped report-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th className="text-end">Quantity</th>
                <th className="text-center">Units</th>
                <th className="text-end">Avg cost</th>
                <th className="text-end">Total cost</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No inventory on hand.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr key={item.resource_id}>
                    <td>{item.resource_name}</td>
                    <td
                      className={`text-end font-monospace${
                        Number(item.quantity) < 0 ? " text-danger" : ""
                      }`}
                    >
                      {formatQuantity(item.quantity)}
                    </td>
                    <td className="text-center">{item.default_units || "—"}</td>
                    <td className="text-end font-monospace">
                      {formatAverageCost(item.average_cost)}
                    </td>
                    <td
                      className={`text-end font-monospace${
                        Number(item.total_cost) < 0 ? " text-danger" : ""
                      }`}
                    >
                      {formatTotalCost(item.total_cost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
