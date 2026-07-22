import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  lineResourceSchema,
  lineResourceToFormValues,
  formValuesToLineResourcePayload,
} from "../../utils/validation/lineResourceSchema";
import {
  createLineResource,
  updateLineResource,
} from "./eventsApi";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";
import { formatAmount } from "./eventUtils";

export default function LineResourceModal({
  isOpen,
  onClose,
  mode,
  resource,
  entryLineId,
  displayOrder,
  defaults,
}) {
  const { selectedOrganizationId } = useOrganization();
  const { alert, dialogProps, Dialog } = useAppDialog();
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(lineResourceSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: lineResourceToFormValues(null, defaults),
  });

  useEscapeToClose(isOpen, () => onClose());

  useEffect(() => {
    if (isOpen) {
      reset(lineResourceToFormValues(resource, defaults));
    }
  }, [isOpen, resource, defaults, reset]);

  const quantity = watch("quantity");
  const unitAmount = watch("unit_amount");

  const extendedPreview = useMemo(() => {
    const qty = Number(quantity);
    const unit = Number(unitAmount);
    if (!Number.isFinite(qty) || !Number.isFinite(unit) || qty <= 0 || unit === 0) {
      return null;
    }
    return Math.round(qty * unit * 100) / 100;
  }, [quantity, unitAmount]);

  const onSubmit = async (data) => {
    try {
      const payload = formValuesToLineResourcePayload(data, {
        displayOrder: isEdit ? resource.display_order : displayOrder,
      });

      if (isEdit) {
        await updateLineResource(selectedOrganizationId, resource.id, payload);
      } else {
        await createLineResource(selectedOrganizationId, entryLineId, payload);
      }

      onClose(true);
    } catch (err) {
      console.error("Save failed", err);
      await alert({
        title: "Save failed",
        message: err.message ?? "Error saving line resource.",
        confirmVariant: "danger",
      });
    }
  };

  return (
    <>
      {isOpen ? (
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
                    {isEdit ? "Edit Line Resource" : "Add Line Resource"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => onClose()}
                  />
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <input
                      className={`form-control ${errors.description ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                      autoFocus
                      {...register("description")}
                    />
                    {errors.description && (
                      <div className="invalid-feedback">
                        {errors.description.message}
                      </div>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-sm-4">
                      <label className="form-label">Quantity</label>
                      <input
                        type="number"
                        step="any"
                        min="0.0001"
                        className={`form-control ${errors.quantity ? "is-invalid" : ""}`}
                        {...register("quantity")}
                      />
                      {errors.quantity && (
                        <div className="invalid-feedback">
                          {errors.quantity.message}
                        </div>
                      )}
                    </div>

                    <div className="col-sm-4">
                      <label className="form-label">Unit</label>
                      <input
                        className="form-control"
                        placeholder="e.g. unit, mL"
                        {...register("unit_measure")}
                      />
                    </div>

                    <div className="col-sm-4">
                      <label className="form-label">Unit Cost</label>
                      <input
                        type="number"
                        step="0.001"
                        className={`form-control ${errors.unit_amount ? "is-invalid" : ""}`}
                        {...register("unit_amount")}
                      />
                      {errors.unit_amount && (
                        <div className="invalid-feedback">
                          {errors.unit_amount.message}
                        </div>
                      )}
                    </div>
                  </div>

                  {extendedPreview != null && (
                    <p className="text-muted small mt-3 mb-0">
                      Extended amount: {formatAmount(extendedPreview)}
                    </p>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary bi-x-circle"
                    title="Cancel"
                    onClick={() => onClose()}
                  ></button>
                  <button
                    type="submit"
                    className="btn btn-primary bi-save"
                    title="Save Line Resource"
                    disabled={!isValid || isSubmitting || (isEdit && !isDirty)}
                  ></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog {...dialogProps} />
    </>
  );
}
