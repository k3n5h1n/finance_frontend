import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useOrganization } from "../../context/OrganizationContext";
import { listAccounts, getAccountHistory } from "./accountsApi";
import {
  flattenAccountTreeForSelect,
  getAccountPathLabel,
} from "./accountTree";
import { formatAmount, formatDate } from "../events/eventUtils";
import {
  getSearchParam,
  patchListSearchParams,
  clearListSearchParams,
} from "../../utils/listSearchParams";
import "./accountHistory.css";

const LIST_PARAM_KEYS = ["account", "start_date", "end_date"];

const ACCOUNT_HISTORY_LOCATION_STATE = { fromAccountHistory: true };

function formatLedgerAmount(value) {
  const amount = Number(value);
  if (!amount) return "—";
  return formatAmount(amount);
}

function PostedStatusBadge({ isPosted }) {
  const posted = Boolean(isPosted);
  return (
    <span
      className={`badge ${posted ? "text-bg-success" : "text-bg-secondary"} text-capitalize`}
    >
      {posted ? "Posted" : "Draft"}
    </span>
  );
}

export default function AccountHistory() {
  const { selectedOrganizationId } = useOrganization();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const prevOrgIdRef = useRef(selectedOrganizationId);

  const selectedAccountId = getSearchParam(searchParams, "account");
  const startDate = getSearchParam(searchParams, "start_date");
  const endDate = getSearchParam(searchParams, "end_date");

  const patchParams = useCallback(
    (updates) => {
      patchListSearchParams(setSearchParams, updates, { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => {
    const prevOrgId = prevOrgIdRef.current;
    if (prevOrgId != null && prevOrgId !== selectedOrganizationId) {
      clearListSearchParams(setSearchParams, LIST_PARAM_KEYS);
    }
    prevOrgIdRef.current = selectedOrganizationId;
  }, [selectedOrganizationId, setSearchParams]);

  const accountOptions = useMemo(
    () =>
      flattenAccountTreeForSelect(
        accounts.filter((account) => account.active !== false)
      ),
    [accounts]
  );

  const selectedAccount = useMemo(
    () => accounts.find((account) => String(account.id) === selectedAccountId),
    [accounts, selectedAccountId]
  );

  const selectedAccountPath = useMemo(() => {
    if (!selectedAccount) return null;
    return getAccountPathLabel(selectedAccount.id, accounts);
  }, [selectedAccount, accounts]);

  useEffect(() => {
    if (selectedOrganizationId == null) return;

    let cancelled = false;

    async function loadAccounts() {
      setAccountsLoading(true);
      setAccountsError(null);

      try {
        const data = await listAccounts(selectedOrganizationId);
        if (!cancelled) setAccounts(data);
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
        if (!cancelled) {
          setAccounts([]);
          setAccountsError(err.message ?? "Failed to load accounts.");
        }
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    }

    loadAccounts();

    return () => {
      cancelled = true;
    };
  }, [selectedOrganizationId]);

  const fetchHistory = useCallback(async () => {
    if (selectedOrganizationId == null || !selectedAccountId) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const data = await getAccountHistory(
        selectedOrganizationId,
        Number(selectedAccountId),
        {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }
      );
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch account history:", err);
      setHistory([]);
      setHistoryError(err.message ?? "Failed to load account history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedOrganizationId, selectedAccountId, startDate, endDate]);

  useEffect(() => {
    if (!selectedAccountId) {
      setHistory([]);
      setHistoryError(null);
      return;
    }

    fetchHistory();
  }, [selectedAccountId, fetchHistory]);

  if (accountsLoading) return <p className="p-4">Loading...</p>;

  if (accountsError) {
    return (
      <>
        <h3 className="mb-3">Account History</h3>
        <div className="alert alert-danger" role="alert">
          {accountsError}
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="mb-3">Account History</h3>

      <div className="card mb-4 account-history-filters">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="account-history-account">
                Account
              </label>
              <select
                id="account-history-account"
                className="form-select"
                value={selectedAccountId}
                onChange={(e) => {
                  patchParams({ account: e.target.value || null });
                }}
              >
                <option value="">Select an account…</option>
                {accountOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selectedAccountPath && (
                <div className="form-text">{selectedAccountPath}</div>
              )}
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="account-history-start">
                Start date
              </label>
              <input
                id="account-history-start"
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => {
                  patchParams({ start_date: e.target.value || null });
                }}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="account-history-end">
                End date
              </label>
              <input
                id="account-history-end"
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => {
                  patchParams({ end_date: e.target.value || null });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {!selectedAccountId ? (
        <p className="text-muted">Select an account to view its history.</p>
      ) : historyLoading ? (
        <p className="text-muted">Loading history…</p>
      ) : historyError ? (
        <div className="alert alert-danger" role="alert">
          {historyError}
        </div>
      ) : (
        <>
          <div className="table-responsive d-none d-md-block">
            <table className="table table-striped account-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-end">Debit</th>
                  <th className="text-end">Credit</th>
                  <th className="text-end">Balance</th>
                  <th className="text-end" style={{ width: "1%" }}></th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No history found for this account.
                    </td>
                  </tr>
                ) : (
                  history.map((row, index) => (
                    <tr key={`${row.event_id}-${row.date}-${index}`}>
                      <td>{formatDate(row.date)}</td>
                      <td>{row.event_description}</td>
                      <td>
                        <PostedStatusBadge isPosted={row.is_posted} />
                      </td>
                      <td className="text-end font-monospace">
                        {formatLedgerAmount(row.debit)}
                      </td>
                      <td className="text-end font-monospace">
                        {formatLedgerAmount(row.credit)}
                      </td>
                      <td className="text-end font-monospace">
                        {formatAmount(Number(row.running_total))}
                      </td>
                      <td className="text-end">
                        <Link
                          className="btn btn-sm btn-secondary bi-eye"
                          to={`/accounting/events/${row.event_id}`}
                          state={ACCOUNT_HISTORY_LOCATION_STATE}
                          title="View event"
                        ></Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="d-md-none account-history-card-list">
            {history.length === 0 ? (
              <p className="text-center text-muted py-4">
                No history found for this account.
              </p>
            ) : (
              history.map((row, index) => (
                <div
                  key={`${row.event_id}-${row.date}-${index}`}
                  className="card mb-3 account-history-card"
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <div className="fw-medium">{row.event_description}</div>
                        <div className="small text-muted">
                          {formatDate(row.date)}
                        </div>
                      </div>
                      <PostedStatusBadge isPosted={row.is_posted} />
                    </div>
                    <div className="row small g-2 mb-2">
                      <div className="col-4">
                        <span className="text-muted d-block">Debit</span>
                        <span className="font-monospace">
                          {formatLedgerAmount(row.debit)}
                        </span>
                      </div>
                      <div className="col-4">
                        <span className="text-muted d-block">Credit</span>
                        <span className="font-monospace">
                          {formatLedgerAmount(row.credit)}
                        </span>
                      </div>
                      <div className="col-4 text-end">
                        <span className="text-muted d-block">Balance</span>
                        <span className="font-monospace">
                          {formatAmount(Number(row.running_total))}
                        </span>
                      </div>
                    </div>
                    <Link
                      className="btn btn-sm btn-secondary bi-eye"
                      to={`/accounting/events/${row.event_id}`}
                      state={ACCOUNT_HISTORY_LOCATION_STATE}
                      title="View event"
                    >
                      View event
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
