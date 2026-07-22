import { useState, useEffect, useMemo } from "react";
import SupplierModal from "./SupplierModal";
import { listSuppliers, deleteSupplier } from "./suppliersApi";
import { useOrganization } from "../../context/OrganizationContext";
import "./suppliers.css";

export default function SuppliersList() {
  const { selectedOrganizationId } = useOrganization();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modalMode, setModalMode] = useState("view");

  const sortedSuppliers = useMemo(
    () => [...suppliers].sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers]
  );

  const fetchSuppliers = async () => {
    if (selectedOrganizationId == null) return;

    setLoading(true);
    setError(null);

    try {
      const data = await listSuppliers(selectedOrganizationId);
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      setSuppliers([]);
      setError(err.message ?? "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [selectedOrganizationId]);

  const openViewModal = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setSelectedSupplier(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const openCopyModal = (supplier) => {
    const copy = {
      ...supplier,
      id: undefined,
      name: `${supplier.name} (copy)`,
    };

    setModalMode("add");
    setSelectedSupplier(copy);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteSupplier(selectedOrganizationId, id);
    fetchSuppliers();
  };

  const closeModal = (refresh) => {
    setIsModalOpen(false);
    if (refresh) fetchSuppliers();
  };

  if (loading) return <p>Loading...</p>;

  if (error) {
    return (
      <>
        <div className="d-flex justify-content-between mb-3">
          <h3>Suppliers</h3>
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
        <h3>Suppliers</h3>
        <button className="btn btn-primary" onClick={openNewModal}>
          Add Supplier
        </button>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th className="text-end" style={{ width: "1%" }}></th>
          </tr>
        </thead>
        <tbody>
          {sortedSuppliers.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-muted py-4">
                No suppliers found
              </td>
            </tr>
          ) : (
            sortedSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.description ?? "—"}</td>
                <td>
                  {supplier.active ? (
                    <span className="badge text-bg-success">Active</span>
                  ) : (
                    <span className="badge text-bg-secondary">Inactive</span>
                  )}
                </td>
                <td className="text-end">
                  <div className="d-flex flex-nowrap justify-content-end gap-1">
                    <button
                      className="btn btn-sm btn-secondary bi-eye"
                      data-bs-toggle="tooltip"
                      title="View Supplier"
                      onClick={() => openViewModal(supplier)}
                    ></button>
                    <button
                      className="btn btn-sm btn-secondary bi-pencil"
                      data-bs-toggle="tooltip"
                      title="Edit Supplier"
                      onClick={() => openEditModal(supplier)}
                    ></button>
                    <button
                      className="btn btn-sm btn-secondary bi-copy"
                      data-bs-toggle="tooltip"
                      title="Copy Supplier"
                      onClick={() => openCopyModal(supplier)}
                    ></button>
                    <button
                      className="btn btn-sm btn-danger bi-trash"
                      data-bs-toggle="tooltip"
                      title="Delete Supplier"
                      onClick={() => handleDelete(supplier.id)}
                    ></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <SupplierModal
        isOpen={isModalOpen}
        onClose={closeModal}
        supplier={selectedSupplier}
        mode={modalMode}
      />
    </>
  );
}
