import { Link } from "react-router-dom";
import { formatAmount } from "../events/eventUtils";
import "./reports.css";

export function formatReportBalance(value) {
  return formatAmount(Number(value));
}

export function ReportAccountTreeRows({
  nodes,
  depth,
  expandedIds,
  onToggle,
  historySearch,
  periodCount = 1,
}) {
  return nodes.flatMap((account) => {
    const hasChildren = account.children.length > 0;
    const isExpanded = expandedIds.has(account.id);
    const multi = periodCount > 1 || Array.isArray(account.reportBalances);
    const balances = multi
      ? (account.reportBalances ?? Array.from({ length: periodCount }, () => "0"))
      : null;

    const rows = [
      <tr key={account.id}>
        <td>
          <div
            className="account-tree-name"
            style={{ paddingLeft: `${depth * 1.25}rem` }}
          >
            {hasChildren ? (
              <button
                type="button"
                className="btn btn-sm btn-link account-tree-toggle p-0 me-1"
                aria-expanded={isExpanded}
                title={isExpanded ? "Collapse" : "Expand"}
                onClick={() => onToggle(account.id)}
              >
                <i
                  className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"}`}
                ></i>
              </button>
            ) : (
              <span className="account-tree-spacer" aria-hidden="true"></span>
            )}
            <span>{account.name}</span>
          </div>
        </td>
        {multi
          ? balances.map((balance, index) => (
              <td key={index} className="text-end font-monospace">
                {formatReportBalance(balance)}
              </td>
            ))
          : (
              <td className="text-end font-monospace">
                {formatReportBalance(account.reportBalance)}
              </td>
            )}
        <td className="text-end">
          <Link
            className="btn btn-sm btn-secondary bi-eye"
            to={`/accounting/account-history?${historySearch(account.id)}`}
            title="View account history"
          ></Link>
        </td>
      </tr>,
    ];

    if (hasChildren && isExpanded) {
      rows.push(
        ...ReportAccountTreeRows({
          nodes: account.children,
          depth: depth + 1,
          expandedIds,
          onToggle,
          historySearch,
          periodCount,
        })
      );
    }

    return rows;
  });
}

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.totalLabel
 * @param {string|number|null} [props.total] single-period total (income statement)
 * @param {Array<string|number|null>} [props.totals] multi-period totals
 * @param {Array<{ end_date?: string, balanced?: boolean, label?: string }>} [props.periodColumns]
 *        When set, amount columns use these headers (typically formatted end dates).
 * @param {import("react").ReactNode} [props.renderPeriodHeader] optional custom header cell
 */
export function ReportSection({
  title,
  totalLabel,
  total,
  totals,
  periodColumns,
  tree,
  expandedIds,
  onToggle,
  historySearch,
  emptyMessage,
}) {
  const multi = Array.isArray(periodColumns) && periodColumns.length > 0;
  const periodCount = multi ? periodColumns.length : 1;
  const columnTotals = multi
    ? (totals ?? periodColumns.map(() => null))
    : null;
  const colSpan = 2 + periodCount;

  return (
    <section className="mb-4">
      <h4 className="report-section-title mb-3">{title}</h4>
      <div className="table-responsive">
        <table className="table table-striped report-table">
          <thead>
            <tr>
              <th>Account</th>
              {multi ? (
                periodColumns.map((period, index) => (
                  <th key={index} className="text-end report-period-col">
                    <div>{period.label}</div>
                    {typeof period.balanced === "boolean" && (
                      <div className="mt-1">
                        <BalancedStatusBadge balanced={period.balanced} compact />
                      </div>
                    )}
                  </th>
                ))
              ) : (
                <th className="text-end">Balance</th>
              )}
              <th className="text-end" style={{ width: "1%" }}></th>
            </tr>
          </thead>
          <tbody>
            {tree.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="text-center text-muted py-4">
                  {emptyMessage ?? `No ${title.toLowerCase()} accounts for this period.`}
                </td>
              </tr>
            ) : (
              <>
                {ReportAccountTreeRows({
                  nodes: tree,
                  depth: 0,
                  expandedIds,
                  onToggle,
                  historySearch,
                  periodCount,
                })}
                {(multi ? columnTotals.some((value) => value != null) : total != null) && (
                  <tr className="report-total-row">
                    <td>{totalLabel}</td>
                    {multi
                      ? columnTotals.map((value, index) => (
                          <td key={index} className="text-end font-monospace">
                            {value != null ? formatReportBalance(value) : "—"}
                          </td>
                        ))
                      : (
                          <td className="text-end font-monospace">
                            {formatReportBalance(total)}
                          </td>
                        )}
                    <td></td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BalancedStatusBadge({ balanced, compact = false }) {
  const isBalanced = Boolean(balanced);
  return (
    <span
      className={`badge report-balanced-badge ${compact ? "report-balanced-badge-compact" : ""} ${isBalanced ? "text-bg-success" : "text-bg-danger"}`}
    >
      {isBalanced ? "Balanced" : "Out of balance"}
    </span>
  );
}
