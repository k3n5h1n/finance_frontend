import { useState, useEffect, useMemo, useCallback } from "react";
import ExternalApiModal from "./ExternalApiModal";
import {
  listExternalApis,
  deleteExternalApi,
  testExternalApiAuthorization,
} from "./externalApisApi";
import {
  formatExternalApiType,
  formatExternalApiProvider,
  formatDateTime,
} from "../../utils/validation/externalApiSchema";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import "./externalData.css";

const AUTH_STATUS = {
  UNKNOWN: "unknown",
  AVAILABLE: "available",
  ERROR: "error",
};

function AuthorizationStatusBadge({ status }) {
  if (status === AUTH_STATUS.AVAILABLE) {
    return <span className="badge text-bg-success">Available</span>;
  }
  if (status === AUTH_STATUS.ERROR) {
    return <span className="badge text-bg-danger">Error</span>;
  }
  return <span className="badge text-bg-secondary">Unknown</span>;
}

function ExternalApiRow({
  externalApi,
  isExpanded,
  onToggle,
  onView,
  onEdit,
  onCopy,
  onDelete,
  authStatuses,
  testingAuthIds,
  onTestAuthorization,
}) {
  const authorizations = externalApi.external_api_authorizations ?? [];
  const hasAuthorizations = authorizations.length > 0;
  const colSpan = 6;

  return (
    <>
      <tr>
        <td>
          <div className="d-flex align-items-center gap-1">
            {hasAuthorizations ? (
              <button
                type="button"
                className="btn btn-sm btn-link p-0 external-api-toggle"
                aria-expanded={isExpanded}
                title={
                  isExpanded ? "Hide authorizations" : "Show authorizations"
                }
                onClick={onToggle}
              >
                <i
                  className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"}`}
                ></i>
              </button>
            ) : (
              <span className="external-api-spacer" aria-hidden="true"></span>
            )}
            <span>{externalApi.name}</span>
            {hasAuthorizations && (
              <span className="badge text-bg-secondary">
                {authorizations.length}
              </span>
            )}
          </div>
        </td>
        <td className="text-center">
          {formatExternalApiType(externalApi.type)}
        </td>
        <td className="text-center">
          {formatExternalApiProvider(externalApi.provider)}
        </td>
        <td className="text-center">
          {externalApi.authorization_required ? (
            <span className="badge text-bg-warning">Required</span>
          ) : (
            <span className="badge text-bg-secondary">Not required</span>
          )}
        </td>
        <td>{externalApi.description ?? "—"}</td>
        <td className="text-end">
          <div className="d-flex flex-nowrap justify-content-end gap-1">
            <button
              type="button"
              className="btn btn-sm btn-secondary bi-eye"
              title="View external data source"
              onClick={onView}
            ></button>
            <button
              type="button"
              className="btn btn-sm btn-secondary bi-pencil"
              title="Edit external data source"
              onClick={onEdit}
            ></button>
            <button
              type="button"
              className="btn btn-sm btn-secondary bi-copy"
              title="Copy external data source"
              onClick={onCopy}
            ></button>
            <button
              type="button"
              className="btn btn-sm btn-danger bi-trash"
              title="Delete external data source"
              onClick={onDelete}
            ></button>
          </div>
        </td>
      </tr>

      {isExpanded && hasAuthorizations && (
        <tr className="external-api-auth-row">
          <td colSpan={colSpan} className="p-0">
            <div className="external-api-auth-panel">
              <div className="table-responsive">
                <table className="table table-sm mb-0 external-api-auth-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Expires</th>
                      <th>Updated</th>
                      <th className="text-center">Status</th>
                      <th className="text-end" style={{ width: "1%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {authorizations.map((auth) => {
                      const status =
                        authStatuses[auth.id] ?? AUTH_STATUS.UNKNOWN;
                      const isTesting = testingAuthIds.has(auth.id);
                      return (
                        <tr key={auth.id}>
                          <td>{auth.person?.name ?? "—"}</td>
                          <td>{formatDateTime(auth.expire_time)}</td>
                          <td>{formatDateTime(auth.updated_dt)}</td>
                          <td className="text-center">
                            <AuthorizationStatusBadge status={status} />
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Test authorization"
                              disabled={isTesting}
                              onClick={() =>
                                onTestAuthorization(externalApi.id, auth.id)
                              }
                            >
                              {isTesting ? "Testing…" : "Test"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ExternalDataList() {
  const { selectedOrganizationId } = useOrganization();
  const { confirm, alert, dialogProps, Dialog } = useAppDialog();
  const [externalApis, setExternalApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [authStatuses, setAuthStatuses] = useState({});
  const [testingAuthIds, setTestingAuthIds] = useState(() => new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExternalApi, setSelectedExternalApi] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const sortedExternalApis = useMemo(
    () => [...externalApis].sort((a, b) => a.name.localeCompare(b.name)),
    [externalApis]
  );

  const fetchExternalApis = useCallback(async () => {
    if (selectedOrganizationId == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await listExternalApis(selectedOrganizationId);
      setExternalApis(data);
      setAuthStatuses({});
    } catch (err) {
      console.error("Failed to fetch external data sources:", err);
      setExternalApis([]);
      setError(err.message ?? "Failed to load external data sources.");
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    fetchExternalApis();
  }, [fetchExternalApis]);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTestAuthorization = async (externalApiId, authorizationId) => {
    setTestingAuthIds((prev) => new Set(prev).add(authorizationId));
    try {
      await testExternalApiAuthorization(
        selectedOrganizationId,
        externalApiId,
        authorizationId
      );
      setAuthStatuses((prev) => ({
        ...prev,
        [authorizationId]: AUTH_STATUS.AVAILABLE,
      }));
    } catch (err) {
      console.error("Authorization test failed", err);
      setAuthStatuses((prev) => ({
        ...prev,
        [authorizationId]: AUTH_STATUS.ERROR,
      }));
    } finally {
      setTestingAuthIds((prev) => {
        const next = new Set(prev);
        next.delete(authorizationId);
        return next;
      });
    }
  };

  const openViewModal = (externalApi) => {
    setSelectedExternalApi(externalApi);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setSelectedExternalApi(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (externalApi) => {
    setSelectedExternalApi(externalApi);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const openCopyModal = (externalApi) => {
    setModalMode("add");
    setSelectedExternalApi({
      ...externalApi,
      id: undefined,
      name: `${externalApi.name} (copy)`,
      created_dt: undefined,
      updated_dt: undefined,
      organization: undefined,
      external_api_authorizations: [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (externalApi) => {
    const confirmed = await confirm({
      title: "Delete external data source",
      message: `Delete "${externalApi.name}"?`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteExternalApi(selectedOrganizationId, externalApi.id);
      fetchExternalApis();
    } catch (err) {
      await alert({
        title: "Delete failed",
        message: err.message ?? "Failed to delete external data source.",
        confirmVariant: "danger",
      });
    }
  };

  const closeModal = (refresh) => {
    setIsModalOpen(false);
    if (refresh) fetchExternalApis();
  };

  if (loading) return <p className="p-4">Loading...</p>;

  if (error) {
    return (
      <>
        <div className="d-flex justify-content-between mb-3">
          <h3>External Data</h3>
        </div>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Dialog {...dialogProps} />
      </>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <h3>External Data</h3>
        <button type="button" className="btn btn-primary" onClick={openNewModal}>
          Add External Data Source
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-center">Type</th>
              <th className="text-center">Provider</th>
              <th className="text-center">Authorization</th>
              <th>Description</th>
              <th className="text-end" style={{ width: "1%" }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedExternalApis.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No external data sources found
                </td>
              </tr>
            ) : (
              sortedExternalApis.map((externalApi) => (
                <ExternalApiRow
                  key={externalApi.id}
                  externalApi={externalApi}
                  isExpanded={expandedIds.has(externalApi.id)}
                  onToggle={() => toggleExpanded(externalApi.id)}
                  onView={() => openViewModal(externalApi)}
                  onEdit={() => openEditModal(externalApi)}
                  onCopy={() => openCopyModal(externalApi)}
                  onDelete={() => handleDelete(externalApi)}
                  authStatuses={authStatuses}
                  testingAuthIds={testingAuthIds}
                  onTestAuthorization={handleTestAuthorization}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <ExternalApiModal
        isOpen={isModalOpen}
        onClose={closeModal}
        externalApi={selectedExternalApi}
        mode={modalMode}
      />

      <Dialog {...dialogProps} />
    </>
  );
}
