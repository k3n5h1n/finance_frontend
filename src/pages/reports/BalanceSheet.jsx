import { useState, useEffect, useCallback, useMemo } from "react";
import { useOrganization } from "../../context/OrganizationContext";
import { listAccounts } from "../accounts/accountsApi";
import { getExpandableIds } from "../accounts/accountTree";
import { getBalanceSheet } from "./reportsApi";
import {
  FISCAL_YEAR_OPTIONS,
  defaultFiscalYears,
  normalizeBalanceSheetReport,
  filterReportRowsByAccountType,
  buildMultiPeriodReportSectionTree,
} from "./incomeStatementUtils";
import { formatDate } from "../events/eventUtils";
import { ReportSection } from "./reportComponents";
import "../accounts/accounts.css";
import "./reports.css";

function buildHistorySearch(endDate) {
  return (accountId) => {
    const params = new URLSearchParams({ account: String(accountId) });
    if (endDate) {
      params.set("end_date", endDate);
    }
    return params.toString();
  };
}

export default function BalanceSheet() {
  const { selectedOrganizationId } = useOrganization();
  const [accounts, setAccounts] = useState([]);
  const [report, setReport] = useState(null);
  const [fiscalYears, setFiscalYears] = useState(defaultFiscalYears);
  const [postedOnly, setPostedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const loadReport = useCallback(async () => {
    if (selectedOrganizationId == null) return;
    if (fiscalYears.length === 0) {
      setReport(null);
      setError("Select at least one fiscal year.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [accountsData, reportData] = await Promise.all([
        listAccounts(selectedOrganizationId),
        getBalanceSheet(selectedOrganizationId, {
          fiscal_years: fiscalYears,
          posted_only: postedOnly,
        }),
      ]);
      setAccounts(accountsData);
      setReport(normalizeBalanceSheetReport(reportData));
      setExpandedIds(getExpandableIds(accountsData));
    } catch (err) {
      console.error("Failed to load balance sheet:", err);
      setAccounts([]);
      setReport(null);
      setError(err.message ?? "Failed to load balance sheet.");
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId, fiscalYears, postedOnly]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const periods = report?.periods ?? [];

  const assetTree = useMemo(
    () =>
      buildMultiPeriodReportSectionTree(
        accounts,
        filterReportRowsByAccountType(report?.rows, "asset")
      ),
    [accounts, report?.rows]
  );

  const liabilityTree = useMemo(
    () =>
      buildMultiPeriodReportSectionTree(
        accounts,
        filterReportRowsByAccountType(report?.rows, "liability")
      ),
    [accounts, report?.rows]
  );

  const equityRows = useMemo(
    () => filterReportRowsByAccountType(report?.rows, "equity"),
    [report?.rows]
  );
  const hasEquityAccounts = equityRows.length > 0;
  const equityTree = useMemo(
    () =>
      hasEquityAccounts
        ? buildMultiPeriodReportSectionTree(accounts, equityRows)
        : [],
    [accounts, equityRows, hasEquityAccounts]
  );

  const periodColumns = useMemo(
    () =>
      periods.map((period) => ({
        label: period.end_date ? formatDate(period.end_date) : "—",
        balanced: period.balanced,
        end_date: period.end_date,
        fiscal_year: period.fiscal_year,
      })),
    [periods]
  );

  const historySearch = useMemo(
    () => buildHistorySearch(periods[0]?.end_date),
    [periods]
  );

  const toggleFiscalYear = (year) => {
    setFiscalYears((prev) => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev;
        return prev.filter((value) => value !== year).sort((a, b) => b - a);
      }
      return [...prev, year].sort((a, b) => b - a);
    });
  };

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(getExpandableIds(accounts));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  if (loading) return <p className="p-4">Loading...</p>;

  if (error && !report) {
    return (
      <>
        <h3 className="mb-3">Balance Sheet</h3>
        <div className="card mb-4">
          <div className="card-body">
            <FiscalYearChecks
              selected={fiscalYears}
              onToggle={toggleFiscalYear}
              postedOnly={postedOnly}
              onPostedOnlyChange={setPostedOnly}
            />
          </div>
        </div>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </>
    );
  }

  if (!report) return null;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <h3 className="mb-0">Balance Sheet</h3>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={expandAll}
          >
            Expand All
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={collapseAll}
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <FiscalYearChecks
            selected={fiscalYears}
            onToggle={toggleFiscalYear}
            postedOnly={postedOnly}
            onPostedOnlyChange={setPostedOnly}
          />
        </div>
      </div>

      <ReportSection
        title="Asset"
        totalLabel="Total assets"
        periodColumns={periodColumns}
        totals={periods.map((period) => period.total_asset)}
        tree={assetTree}
        expandedIds={expandedIds}
        onToggle={toggleExpanded}
        historySearch={historySearch}
      />

      <ReportSection
        title="Liability"
        totalLabel="Total liabilities"
        periodColumns={periodColumns}
        totals={periods.map((period) => period.total_liability)}
        tree={liabilityTree}
        expandedIds={expandedIds}
        onToggle={toggleExpanded}
        historySearch={historySearch}
      />

      <ReportSection
        title="Equity"
        totalLabel="Total equity"
        periodColumns={periodColumns}
        totals={
          hasEquityAccounts
            ? periods.map((period) => period.total_equity)
            : periods.map(() => null)
        }
        tree={equityTree}
        expandedIds={expandedIds}
        onToggle={toggleExpanded}
        historySearch={historySearch}
        emptyMessage="No equity accounts defined."
      />
    </>
  );
}

function FiscalYearChecks({
  selected,
  onToggle,
  postedOnly,
  onPostedOnlyChange,
}) {
  return (
    <div className="row g-3 align-items-end">
      <div className="col-md-8">
        <div className="form-label">Fiscal years</div>
        <div className="d-flex flex-wrap gap-3">
          {[...FISCAL_YEAR_OPTIONS].sort((a, b) => b - a).map((year) => (
            <div className="form-check mb-0" key={year}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`balance-sheet-year-${year}`}
                checked={selected.includes(year)}
                onChange={() => onToggle(year)}
              />
              <label
                className="form-check-label"
                htmlFor={`balance-sheet-year-${year}`}
              >
                {year}
              </label>
            </div>
          ))}
        </div>
        <div className="form-text">
          Columns show period end dates; most recent year on the left.
        </div>
      </div>
      <div className="col-md-4">
        <div className="form-check mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            id="balance-sheet-posted-only"
            checked={postedOnly}
            onChange={(e) => onPostedOnlyChange(e.target.checked)}
          />
          <label
            className="form-check-label"
            htmlFor="balance-sheet-posted-only"
          >
            Posted only
          </label>
        </div>
      </div>
    </div>
  );
}
