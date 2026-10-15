import { NavLink, Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useOrganization } from "../../context/OrganizationContext";
import { getInvestment } from "./investmentsApi";
import {
  formatInvestmentType,
  formatInvestmentDate,
  formatInvestmentDateTime,
  isInvestmentClosed,
} from "./investmentUtils";
import "./investing.css";

function BackLink({ onBack, label }) {
  return (
    <button
      type="button"
      className="btn btn-link ps-0 mb-2 investment-back-link"
      onClick={onBack}
    >
      <i className="bi bi-arrow-left me-1"></i>
      {label}
    </button>
  );
}

export default function InvestmentWorkspace() {
  const { investmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOrganizationId } = useOrganization();

  const navigateBack = useCallback(() => {
    navigate("/investing/investments");
  }, [navigate]);

  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInvestment = useCallback(async () => {
    if (selectedOrganizationId == null || investmentId == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getInvestment(selectedOrganizationId, investmentId);
      setInvestment(data);
    } catch (err) {
      console.error("Failed to load investment:", err);
      setInvestment(null);
      setError(err.message ?? "Failed to load investment.");
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId, investmentId]);

  useEffect(() => {
    loadInvestment();
  }, [loadInvestment]);

  if (loading) {
    return (
      <>
        <BackLink onBack={navigateBack} label="Back to investments" />
        <p>Loading...</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <BackLink onBack={navigateBack} label="Back to investments" />
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      </>
    );
  }

  if (!investment) {
    return (
      <>
        <BackLink onBack={navigateBack} label="Back to investments" />
        <div className="alert alert-warning mt-3" role="alert">
          Investment not found.
        </div>
      </>
    );
  }

  const closed = isInvestmentClosed(investment);
  const brokerApiEnabled = investment.external_api_id != null;
  const basePath = `/investing/investments/${investmentId}`;
  const tabState = location.state;

  return (
    <div className="investment-workspace">
      <BackLink onBack={navigateBack} label="Back to investments" />

      <header className="investment-workspace-header card mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h3 className="mb-2">{investment.name}</h3>
              <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                {closed ? (
                  <span className="badge text-bg-secondary">Closed</span>
                ) : (
                  <span className="badge text-bg-success">Open</span>
                )}
                <span className="badge text-bg-light">
                  {formatInvestmentType(investment.type)}
                </span>
              </div>

              <dl className="row mb-0 small">
                <dt className="col-sm-4 col-lg-3 text-muted">External account</dt>
                <dd className="col-sm-8 col-lg-9">
                  {investment.external_account_label ?? "—"}
                </dd>

                <dt className="col-sm-4 col-lg-3 text-muted">Opened</dt>
                <dd className="col-sm-8 col-lg-9">
                  {formatInvestmentDate(investment.date_opened)}
                </dd>

                <dt className="col-sm-4 col-lg-3 text-muted">Closed</dt>
                <dd className="col-sm-8 col-lg-9">
                  {formatInvestmentDate(investment.date_closed)}
                </dd>

                <dt className="col-sm-4 col-lg-3 text-muted">External API</dt>
                <dd className="col-sm-8 col-lg-9">
                  {brokerApiEnabled ? `API #${investment.external_api_id}` : "—"}
                  {investment.external_api_account_id != null &&
                    ` · account ${investment.external_api_account_id}`}
                  {investment.external_api_user_id != null &&
                    ` · user ${investment.external_api_user_id}`}
                </dd>
              </dl>
            </div>

            <div className="text-end">
              {brokerApiEnabled && (
                <div className="mb-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled
                    title="Coming soon"
                  >
                    Fetch transactions
                  </button>
                  <div className="text-muted small mt-1">Last fetched —</div>
                </div>
              )}
              <div className="text-muted small">
                <div>Created {formatInvestmentDateTime(investment.created_dt)}</div>
                <div>Updated {formatInvestmentDateTime(investment.updated_dt)}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ul className="nav nav-tabs investment-workspace-tabs mb-4">
        <li className="nav-item">
          <NavLink
            end
            replace
            to={basePath}
            state={tabState}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Overview
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            replace
            to={`${basePath}/transactions`}
            state={tabState}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Transactions
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            replace
            to={`${basePath}/holdings`}
            state={tabState}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Holdings
          </NavLink>
        </li>
      </ul>

      <Outlet context={{ investment }} />
    </div>
  );
}
