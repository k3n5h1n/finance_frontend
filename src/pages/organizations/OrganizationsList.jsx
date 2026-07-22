import { useState, useEffect } from "react";
import OrganizationModal from "./OrganizationModal";
import { listOrganizations, deleteOrganization } from "./organizationsApi";
import { formatOrganizationMembers } from "../../utils/validation/organizationSchema";
import "./organizations.css";

export default function OrganizationsList() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const fetchOrganizations = async () => {
    try {
      const data = await listOrganizations();
      setOrganizations(data);
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const openViewModal = (organization) => {
    setSelectedOrganization(organization);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setSelectedOrganization(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (organization) => {
    setSelectedOrganization(organization);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const openCopyModal = (organization) => {
    const copy = {
      ...organization,
      id: undefined,
      name: `${organization.name} (copy)`,
    };

    setModalMode("add");
    setSelectedOrganization(copy);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteOrganization(id);
    fetchOrganizations();
  };

  const closeModal = (refresh) => {
    setIsModalOpen(false);
    if (refresh) fetchOrganizations();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <h3>Organizations</h3>
        <button className="btn btn-primary" onClick={openNewModal}>
          Add Organization
        </button>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Members</th>
            <th className="text-end" style={{ width: "1%" }}></th>
          </tr>
        </thead>
        <tbody>
          {organizations.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted py-4">
                No organizations found
              </td>
            </tr>
          ) : (
            organizations.map((org) => (
              <tr key={org.id}>
                <td>{org.name}</td>
                <td className="text-capitalize">{org.type}</td>
                <td>{org.description ?? "—"}</td>
                <td>{formatOrganizationMembers(org)}</td>
                <td className="text-end">
                  <div className="d-flex flex-nowrap justify-content-end gap-1">
                    <button
                      className="btn btn-sm btn-secondary bi-eye"
                      data-bs-toggle="tooltip"
                      title="View Organization"
                      onClick={() => openViewModal(org)}
                    ></button>
                    <button
                      className="btn btn-sm btn-secondary bi-pencil"
                      data-bs-toggle="tooltip"
                      title="Edit Organization"
                      onClick={() => openEditModal(org)}
                    ></button>
                    <button
                      className="btn btn-sm btn-secondary bi-copy"
                      data-bs-toggle="tooltip"
                      title="Copy Organization"
                      onClick={() => openCopyModal(org)}
                    ></button>
                    <button
                      className="btn btn-sm btn-danger bi-trash"
                      data-bs-toggle="tooltip"
                      title="Delete Organization"
                      onClick={() => handleDelete(org.id)}
                    ></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <OrganizationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        organization={selectedOrganization}
        mode={modalMode}
      />
    </>
  );
}
