import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RESOURCE_TYPES,
  resourceSchema,
  resourceToFormValues,
  formValuesToResourcePayload,
  formatResourceType,
} from "../../utils/validation/resourceSchema";
import {
  createResource,
  updateResource,
  deleteResource,
} from "./resourcesApi";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function ResourceModal({ isOpen, onClose, resource, mode }) {
  const { selectedOrganizationId } = useOrganization();
  const { confirm, alert, dialogProps, Dialog } = useAppDialog();
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const isAdd = mode === "add";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(resourceSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: resourceToFormValues(null),
  });

  useEscapeToClose(isOpen, () => onClose(false));

  useEffect(() => {
    if (isOpen) {
      reset(resourceToFormValues(resource));
    }
  }, [isOpen, resource, reset]);

  const selectedType = watch("type");
  const isItemType = selectedType === "ITEM";

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      const payload = formValuesToResourcePayload(data);
      if (isEdit) {
        await updateResource(selectedOrganizationId, resource.id, payload);
      } else {
        await createResource(selectedOrganizationId, payload);
      }
      onClose(true);
    } catch (err) {
      console.error("Save failed", err);
      await alert({
        title: "Save failed",
        message: err.message ?? "Error saving resource.",
        confirmVariant: "danger",
      });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete resource",
      message: `Delete "${resource.name}"?`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteResource(selectedOrganizationId, resource.id);
      onClose(true);
    } catch (err) {
      console.error("Deletion failed", err);
      await alert({
        title: "Delete failed",
        message: err.message ?? "Error deleting resource.",
        confirmVariant: "danger",
      });
    }
  };

  return (
    <>
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
                    ? "Edit Resource"
                    : isAdd
                      ? "Add New Resource"
                      : "View Resource"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => onClose(false)}
                />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label" htmlFor="resource-name">
                    Name
                  </label>
                  <input
                    id="resource-name"
                    className={`form-control ${errors.name ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                    disabled={isView}
                    autoFocus={!isView}
                    {...register("name")}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="resource-type">
                    Type
                  </label>
                  <select
                    id="resource-type"
                    className={`form-select ${errors.type ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                    disabled={isView}
                    {...register("type")}
                  >
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatResourceType(type)}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <div className="invalid-feedback">{errors.type.message}</div>
                  )}
                </div>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="resource-is-active"
                    disabled={isView}
                    {...register("is_active")}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="resource-is-active"
                  >
                    Active
                  </label>
                </div>

                {isItemType && (
                  <fieldset className="border rounded p-3">
                    <legend className="float-none w-auto px-2 fs-6 mb-0">
                      Item details
                    </legend>
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="resource-tracks-quantity"
                        disabled={isView}
                        {...register("tracks_quantity")}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="resource-tracks-quantity"
                      >
                        Track quantity
                      </label>
                    </div>
                    <div className="mb-0">
                      <label
                        className="form-label"
                        htmlFor="resource-default-units"
                      >
                        Default units
                      </label>
                      <input
                        id="resource-default-units"
                        className="form-control"
                        placeholder="e.g. dozen, lbs"
                        disabled={isView}
                        {...register("default_units")}
                      />
                    </div>
                  </fieldset>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary bi-x-circle"
                  title="Cancel"
                  onClick={() => onClose(false)}
                ></button>
                {!isView && resource?.id != null && (
                  <button
                    type="button"
                    className="btn btn-danger me-auto bi-trash"
                    title="Delete Resource"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  ></button>
                )}
                {!isView && (
                  <button
                    type="submit"
                    className="btn btn-primary bi-save"
                    title={isEdit ? "Save Changes" : "Create Resource"}
                    disabled={!isDirty || !isValid || isSubmitting}
                  ></button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <Dialog {...dialogProps} />
    </>
  );
}
