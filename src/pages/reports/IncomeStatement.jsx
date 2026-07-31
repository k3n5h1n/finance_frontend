import { useState, useEffect, useCallback, useMemo } from "react";
import { useOrganization } from "../../context/OrganizationContext";
import { listAccounts } from "../accounts/accountsApi";
import { getExpandableIds } from "../accounts/accountTree";
import { getIncomeStatement } from "./reportsApi";
import {
  FISCAL_YEAR_OPTIONS,
  defaultFiscalYear,
  buildReportSectionTree,
} from "./incomeStatementUtils";
import { formatDate } from "../events/eventUtils";
import { formatReportBalance, ReportSection } from "./reportComponents";
import "../accounts/accounts.css";
import "./reports.css";

function buildHistorySearch(startDate, endDate) {
  return (accountId) => {
    const params = new URLSearchParams({ account: String(accountId) });
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    return params.toString();
  };
}

export default function IncomeStatement() {
  const { selectedOrganizationId } = useOrganization();
  const [accounts, setAccounts] = useState([]);
  const [report, setReport] = useState(null);
  const [fiscalYear, setFiscalYear] = useState(defaultFiscalYear);
  const [postedOnly, setPostedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const loadReport = useCallback(async () => {
    if (selectedOrganizationId == null) return;

    setLoading(true);
    setError(null);

    try {
      const [accountsData, reportData] = await Promise.all([
        listAccounts(selectedOrganizationId),
        getIncomeStatement(selectedOrganizationId, {
          fiscal_year: fiscalYear,
          posted_only: postedOnly,
        }),
      ]);
      setAccounts(accountsData);
      setReport(reportData);
      setExpandedIds(getExpandableIds(accountsData));
    } catch (err) {
      console.error("Failed to load income statement:", err);
      setAccounts([]);
      setReport(null);
      setError(err.message ?? "Failed to load income statement.");
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId, fiscalYear, postedOnly]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const revenueTree = useMemo(
    () => buildReportSectionTree(accounts, report?.revenue),
    [accounts, report?.revenue]
  );

  const expenseTree = useMemo(
    () => buildReportSectionTree(accounts, report?.expense),
    [accounts, report?.expense]
  );

  const historySearch = useMemo(
    () => buildHistorySearch(report?.start_date, report?.end_date),
    [report?.start_date, report?.end_date]
  );

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

  if (error) {
    return (
      <>
        <h3 className="mb-3">Income Statement</h3>
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
        <h3 className="mb-0">Income Statement</h3>
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
          <div className="row g-3 align-items-start">
            <div className="col-sm-4 col-md-3">
              <label className="form-label" htmlFor="income-statement-fiscal-year">
                Fiscal year
              </label>
              <select
                id="income-statement-fiscal-year"
                className="form-select"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
              >
                {FISCAL_YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-4 col-md-3">
              <label className="form-label" htmlFor="income-statement-posted-only">
                Posted only
              </label>
              <div className="form-check report-filter-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="income-statement-posted-only"
                  checked={postedOnly}
                  onChange={(e) => setPostedOnly(e.target.checked)}
                />
              </div>
            </div>
            <div className="col-sm-4 col-md-6">
              <div className="form-label">Period</div>
              <div className="report-filter-check-field text-muted">
                {formatDate(report.start_date)} – {formatDate(report.end_date)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportSection
        title="Revenue"
        totalLabel="Total revenue"
        total={report.total_revenue}
        tree={revenueTree}
        expandedIds={expandedIds}
        onToggle={toggleExpanded}
        historySearch={historySearch}
      />

      <ReportSection
        title="Expense"
        totalLabel="Total expense"
        total={report.total_expense}
        tree={expenseTree}
        expandedIds={expandedIds}
        onToggle={toggleExpanded}
        historySearch={historySearch}
      />

      <div className="card">
        <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span className="report-summary-label">Net income</span>
          <span className="report-summary-label font-monospace">
            {formatReportBalance(report.net_income)}
          </span>
        </div>
      </div>
    </>
  );
}
