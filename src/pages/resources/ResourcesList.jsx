import { useState, useEffect, useMemo, useCallback } from "react";
import ResourceModal from "./ResourceModal";
import { listResources, deleteResource } from "./resourcesApi";
import {
  formatResourceType,
  formatResourceDetails,
} from "../../utils/validation/resourceSchema";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import "./resources.css";

export default function ResourcesList() {
  const { selectedOrganizationId } = useOrganization();
  const { confirm, alert, dialogProps, Dialog } = useAppDialog();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const sortedResources = useMemo(
    () => [...resources].sort((a, b) => a.name.localeCompare(b.name)),
    [resources]
  );

  const fetchResources = useCallback(async () => {
    if (selectedOrganizationId == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await listResources(selectedOrganizationId);
      setResources(data);
    } catch (err) {
      console.error("Failed to fetch resources:", err);
      setResources([]);
      setError(err.message ?? "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const openViewModal = (resource) => {
    setSelectedResource(resource);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setSelectedResource(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (resource) => {
    setSelectedResource(resource);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const openCopyModal = (resource) => {
    setModalMode("add");
    setSelectedResource({
      ...resource,
      id: undefined,
      name: `${resource.name} (copy)`,
      item: resource.item
        ? {
            tracks_quantity: resource.item.tracks_quantity,
            default_units: resource.item.default_units,
          }
        : undefined,
      instrument: resource.instrument
        ? {
            symbol: resource.instrument.symbol,
            type: resource.instrument.type,
            currency: resource.instrument.currency,
            market_api_id: resource.instrument.market_api_id,
            date_listed: resource.instrument.date_listed,
            date_delisted: resource.instrument.date_delisted,
            isin: resource.instrument.isin,
            cusip: resource.instrument.cusip,
          }
        : undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (resource) => {
    const confirmed = await confirm({
      title: "Delete resource",
      message: `Delete "${resource.name}"?`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteResource(selectedOrganizationId, resource.id);
      fetchResources();
    } catch (err) {
      await alert({
        title: "Delete failed",
        message: err.message ?? "Failed to delete resource.",
        confirmVariant: "danger",
      });
    }
  };

  const closeModal = (refresh) => {
    setIsModalOpen(false);
    if (refresh) fetchResources();
  };

  if (loading) return <p className="p-4">Loading...</p>;

  if (error) {
    return (
      <>
        <div className="d-flex justify-content-between mb-3">
          <h3>Resources</h3>
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
        <h3>Resources</h3>
        <button type="button" className="btn btn-primary" onClick={openNewModal}>
          Add Resource
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-center">Type</th>
              <th>Details</th>
              <th className="text-center">Status</th>
              <th className="text-end" style={{ width: "1%" }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedResources.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  No resources found
                </td>
              </tr>
            ) : (
              sortedResources.map((resource) => (
                <tr key={resource.id}>
                  <td className="resources-name-cell">{resource.name}</td>
                  <td className="resources-type-cell">
                    {formatResourceType(resource.type)}
                  </td>
                  <td>{formatResourceDetails(resource)}</td>
                  <td className="resources-status-cell">
                    {resource.is_active ? (
                      <span className="badge text-bg-success">Active</span>
                    ) : (
                      <span className="badge text-bg-secondary">Inactive</span>
                    )}
                  </td>
                  <td className="text-end">
                    <div className="d-flex flex-nowrap justify-content-end gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary bi-eye"
                        title="View resource"
                        onClick={() => openViewModal(resource)}
                      ></button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary bi-pencil"
                        title="Edit resource"
                        onClick={() => openEditModal(resource)}
                      ></button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary bi-copy"
                        title="Copy resource"
                        onClick={() => openCopyModal(resource)}
                      ></button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger bi-trash"
                        title="Delete resource"
                        onClick={() => handleDelete(resource)}
                      ></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ResourceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        resource={selectedResource}
        mode={modalMode}
      />

      <Dialog {...dialogProps} />
    </>
  );
}
