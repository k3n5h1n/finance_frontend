import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { listInvestments } from "./investmentsApi";
import {
  formatInvestmentType,
  formatInvestmentDate,
  isInvestmentClosed,
  sortInvestmentsDefault,
} from "./investmentUtils";
import { useOrganization } from "../../context/OrganizationContext";

const INVESTMENTS_LIST_LOCATION_STATE = { fromInvestmentsList: true };

export default function Investments() {
  const { selectedOrganizationId } = useOrganization();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sortedInvestments = useMemo(
    () => sortInvestmentsDefault(investments),
    [investments]
  );

  const fetchInvestments = useCallback(async () => {
    if (selectedOrganizationId == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await listInvestments(selectedOrganizationId);
      setInvestments(data);
    } catch (err) {
      console.error("Failed to fetch investments:", err);
      setInvestments([]);
      setError(err.message ?? "Failed to load investments.");
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  if (loading) return <p className="p-4">Loading...</p>;

  if (error) {
    return (
      <>
        <div className="d-flex justify-content-between mb-3">
          <h3>Investments</h3>
        </div>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <h3>Investments</h3>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-center">Type</th>
              <th>External account</th>
              <th>Opened</th>
              <th>Closed</th>
              <th className="text-center">Status</th>
              <th className="text-center">Broker API</th>
              <th className="text-end" style={{ width: "1%" }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedInvestments.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  No investments found
                </td>
              </tr>
            ) : (
              sortedInvestments.map((investment) => {
                const closed = isInvestmentClosed(investment);
                const brokerApiEnabled = investment.external_api_id != null;

                return (
                  <tr key={investment.id}>
                    <td>{investment.name}</td>
                    <td className="text-center">
                      {formatInvestmentType(investment.type)}
                    </td>
                    <td>{investment.external_account_label ?? "—"}</td>
                    <td>{formatInvestmentDate(investment.date_opened)}</td>
                    <td>{formatInvestmentDate(investment.date_closed)}</td>
                    <td className="text-center">
                      {closed ? (
                        <span className="badge text-bg-secondary">Closed</span>
                      ) : (
                        <span className="badge text-bg-success">Open</span>
                      )}
                    </td>
                    <td className="text-center">
                      {brokerApiEnabled ? (
                        <span className="badge text-bg-success">Enabled</span>
                      ) : (
                        <span className="badge text-bg-secondary">Off</span>
                      )}
                    </td>
                    <td className="text-end">
                      <Link
                        className="btn btn-sm btn-secondary bi-eye"
                        to={`/investing/investments/${investment.id}`}
                        state={INVESTMENTS_LIST_LOCATION_STATE}
                        title="View investment"
                      ></Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
