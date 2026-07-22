import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  supplierSchema,
  supplierToFormValues,
  formValuesToPayload,
} from "../../utils/validation/supplierSchema";
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "./suppliersApi";
import { useOrganization } from "../../context/OrganizationContext";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function SupplierModal({ isOpen, onClose, supplier, mode }) {
  const { selectedOrganizationId } = useOrganization();
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const isAdd = mode === "add";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: supplierToFormValues(null),
  });

  useEscapeToClose(isOpen, () => onClose(false));

  useEffect(() => {
    reset(supplierToFormValues(supplier));
  }, [supplier, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      const payload = formValuesToPayload(data);
      if (isEdit) {
        await updateSupplier(selectedOrganizationId, supplier.id, payload);
      } else {
        await createSupplier(selectedOrganizationId, payload);
      }
      onClose(true);
    } catch (err) {
      console.error("Save failed", err);
      alert(err.message ?? "Error saving supplier.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSupplier(selectedOrganizationId, supplier.id);
      onClose(true);
    } catch (err) {
      console.error("Deletion failed", err);
      alert("Error deleting supplier.");
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-header">
              <h5 className="modal-title">
                {isEdit
                  ? "Edit Supplier"
                  : isAdd
                    ? "Add New Supplier"
                    : "View Supplier"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => onClose(false)}
              />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  className={`form-control ${errors.name ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                  disabled={isView}
                  {...register("name")}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className={`form-control ${errors.description ? "is-invalid" : ""}`}
                  rows={3}
                  disabled={isView}
                  {...register("description")}
                />
                {errors.description && (
                  <div className="invalid-feedback">
                    {errors.description.message}
                  </div>
                )}
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  disabled={isView}
                  {...register("active")}
                />
                <label className="form-check-label">Active</label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary bi-x-circle"
                data-bs-toggle="tooltip"
                title="Cancel"
                onClick={() => onClose(false)}
              ></button>
              {!isView && supplier?.id != null && (
                <button
                  type="button"
                  className="btn btn-danger me-auto bi-trash"
                  data-bs-toggle="tooltip"
                  title="Delete Supplier"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                ></button>
              )}
              {!isView && (
                <button
                  type="submit"
                  className="btn btn-primary bi-save"
                  data-bs-toggle="tooltip"
                  title={isEdit ? "Save Changes" : "Create Supplier"}
                  disabled={!isDirty || !isValid || isSubmitting}
                ></button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
