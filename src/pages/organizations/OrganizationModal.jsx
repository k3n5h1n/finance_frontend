import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ORGANIZATION_TYPES,
  organizationSchema,
  organizationToFormValues,
  formValuesToPayload,
} from "../../utils/validation/organizationSchema";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "./organizationsApi";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function OrganizationModal({
  isOpen,
  onClose,
  organization,
  mode,
}) {
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const isAdd = mode === "add";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(organizationSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: organizationToFormValues(null),
  });

  useEscapeToClose(isOpen, () => onClose(false));

  useEffect(() => {
    reset(organizationToFormValues(organization));
  }, [organization, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      const payload = formValuesToPayload(data);
      if (isEdit) {
        await updateOrganization(organization.id, payload);
      } else {
        await createOrganization(payload);
      }
      onClose(true);
    } catch (err) {
      console.error("Save failed", err);
      alert(err.message ?? "Error saving organization.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrganization(organization.id);
      onClose(true);
    } catch (err) {
      console.error("Deletion failed", err);
      alert("Error deleting organization.");
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
                  ? "Edit Organization"
                  : isAdd
                    ? "Add New Organization"
                    : "View Organization"}
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

              <div className="mb-3">
                <label className="form-label">Type</label>
                <select
                  className={`form-select ${errors.type ? "is-invalid" : ""}`}
                  disabled={isView}
                  {...register("type")}
                >
                  {ORGANIZATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <div className="invalid-feedback">{errors.type.message}</div>
                )}
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
              {!isView && organization?.id != null && (
                <button
                  type="button"
                  className="btn btn-danger me-auto bi-trash"
                  data-bs-toggle="tooltip"
                  title="Delete Organization"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                ></button>
              )}
              {!isView && (
                <button
                  type="submit"
                  className="btn btn-primary bi-save"
                  data-bs-toggle="tooltip"
                  title={isEdit ? "Save Changes" : "Create Organization"}
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
