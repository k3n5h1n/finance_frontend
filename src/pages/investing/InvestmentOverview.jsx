import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  formatAccountLinkType,
  formatPersonRole,
  formatInterestFraction,
} from "./investmentUtils";

export default function InvestmentOverview() {
  const { investment } = useOutletContext();

  const linkedAccounts = useMemo(() => {
    const rows = investment?.accounts ?? [];
    return [...rows].sort((a, b) =>
      formatAccountLinkType(a.type).localeCompare(formatAccountLinkType(b.type))
    );
  }, [investment]);

  const linkedPeople = useMemo(() => {
    const rows = investment?.persons ?? [];
    return [...rows].sort((a, b) =>
      (a.person_name ?? "").localeCompare(b.person_name ?? "")
    );
  }, [investment]);

  return (
    <>
      <section className="card mb-4 investment-section-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Accounts</h5>
          <span className="badge text-bg-secondary">{linkedAccounts.length}</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped mb-0 investment-section-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="text-center">Link type</th>
                </tr>
              </thead>
              <tbody>
                {linkedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center text-muted py-4">
                      No accounts linked
                    </td>
                  </tr>
                ) : (
                  linkedAccounts.map((link) => (
                    <tr key={link.id}>
                      <td>
                        {link.account_name ?? (
                          <span className="text-muted">
                            Account #{link.account_id}
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        {formatAccountLinkType(link.type)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card mb-4 investment-section-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">People</h5>
          <span className="badge text-bg-secondary">{linkedPeople.length}</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped mb-0 investment-section-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th className="text-center">Role</th>
                  <th className="text-end">Interest</th>
                </tr>
              </thead>
              <tbody>
                {linkedPeople.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-4">
                      No people linked
                    </td>
                  </tr>
                ) : (
                  linkedPeople.map((link) => (
                    <tr key={link.id}>
                      <td>
                        {link.person_name ?? (
                          <span className="text-muted">
                            Person #{link.person_id}
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        {formatPersonRole(link.role)}
                      </td>
                      <td className="text-end">
                        {formatInterestFraction(link.interest_fraction)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
