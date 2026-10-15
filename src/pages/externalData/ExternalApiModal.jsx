import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EXTERNAL_API_TYPES,
  EXTERNAL_API_PROVIDERS,
  externalApiSchema,
  externalApiToFormValues,
  formValuesToExternalApiPayload,
  formatExternalApiType,
  formatExternalApiProvider,
  formatDateTime,
} from "../../utils/validation/externalApiSchema";
import {
  createExternalApi,
  updateExternalApi,
  deleteExternalApi,
} from "./externalApisApi";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function ExternalApiModal({ isOpen, onClose, externalApi, mode }) {
  const { selectedOrganizationId } = useOrganization();
  const { confirm, alert, dialogProps, Dialog } = useAppDialog();
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const isAdd = mode === "add";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(externalApiSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: externalApiToFormValues(null),
  });

  useEscapeToClose(isOpen, () => onClose(false));

  useEffect(() => {
    if (isOpen) {
      reset(externalApiToFormValues(externalApi));
    }
  }, [isOpen, externalApi, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      const payload = formValuesToExternalApiPayload(data);
      if (isEdit) {
        await updateExternalApi(selectedOrganizationId, externalApi.id, payload);
      } else {
        await createExternalApi(selectedOrganizationId, payload);
      }
      onClose(true);
    } catch (err) {
      console.error("Save failed", err);
      await alert({
        title: "Save failed",
        message: err.message ?? "Error saving external data source.",
        confirmVariant: "danger",
      });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete external data source",
      message: `Delete "${externalApi.name}"?`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteExternalApi(selectedOrganizationId, externalApi.id);
      onClose(true);
    } catch (err) {
      console.error("Deletion failed", err);
      await alert({
        title: "Delete failed",
        message: err.message ?? "Error deleting external data source.",
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
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEdit
                    ? "Edit External Data Source"
                    : isAdd
                      ? "Add External Data Source"
                      : "View External Data Source"}
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
                  <label className="form-label">Type</label>
                  <select
                    className={`form-select ${errors.type ? "is-invalid" : ""}`}
                    disabled={isView}
                    {...register("type")}
                  >
                    {EXTERNAL_API_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatExternalApiType(type)}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <div className="invalid-feedback">{errors.type.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Provider</label>
                  <select
                    className={`form-select ${errors.provider ? "is-invalid" : ""}`}
                    disabled={isView}
                    {...register("provider")}
                  >
                    {EXTERNAL_API_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {formatExternalApiProvider(provider)}
                      </option>
                    ))}
                  </select>
                  {errors.provider && (
                    <div className="invalid-feedback">
                      {errors.provider.message}
                    </div>
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

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    disabled={isView}
                    {...register("authorization_required")}
                  />
                  <label className="form-check-label">
                    Authorization required
                  </label>
                </div>

                {isView && externalApi && (
                  <dl className="row mb-0 small text-muted">
                    <dt className="col-sm-4">Created</dt>
                    <dd className="col-sm-8">
                      {formatDateTime(externalApi.created_dt)}
                    </dd>
                    <dt className="col-sm-4">Updated</dt>
                    <dd className="col-sm-8">
                      {formatDateTime(externalApi.updated_dt)}
                    </dd>
                    {externalApi.organization?.name && (
                      <>
                        <dt className="col-sm-4">Organization</dt>
                        <dd className="col-sm-8">
                          {externalApi.organization.name}
                        </dd>
                      </>
                    )}
                  </dl>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary bi-x-circle"
                  title="Cancel"
                  onClick={() => onClose(false)}
                ></button>
                {!isView && externalApi?.id != null && (
                  <button
                    type="button"
                    className="btn btn-danger me-auto bi-trash"
                    title="Delete external data source"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  ></button>
                )}
                {!isView && (
                  <button
                    type="submit"
                    className="btn btn-primary bi-save"
                    title={isEdit ? "Save changes" : "Create external data source"}
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
