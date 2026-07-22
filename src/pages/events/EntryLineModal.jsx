import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  entryLineSchema,
  entryLineToFormValues,
  formValuesToEntryLinePayload,
} from "../../utils/validation/entryLineSchema";
import {
  createEntryLine,
  updateEntryLine,
} from "./eventsApi";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function EntryLineModal({
  isOpen,
  onClose,
  mode,
  line,
  entryId,
  displayOrder,
  balancingDefaults,
  accountOptions = [],
  supplierOptions = [],
}) {
  const { selectedOrganizationId } = useOrganization();
  const { alert, dialogProps, Dialog } = useAppDialog();
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(entryLineSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: entryLineToFormValues(null, balancingDefaults),
  });

  useEscapeToClose(isOpen, () => onClose());

  useEffect(() => {
    if (isOpen) {
      reset(entryLineToFormValues(line, balancingDefaults));
    }
  }, [isOpen, line, balancingDefaults, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = formValuesToEntryLinePayload(data, {
        displayOrder: isEdit ? line.display_order : displayOrder,
      });

      // Omit null supplier on create; on edit send null to clear the field
      if (!isEdit && payload.supplier_id == null) {
        delete payload.supplier_id;
      }

      if (isEdit) {
        await updateEntryLine(selectedOrganizationId, line.id, payload);
      } else {
        await createEntryLine(selectedOrganizationId, entryId, payload);
      }

      onClose(true);
    } catch (err) {
      console.error("Save failed", err);
      await alert({
        title: "Save failed",
        message: err.message ?? "Error saving entry line.",
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
                {isEdit ? "Edit Line" : "Add Line"}
              </h5>
              <button type="button" className="btn-close" onClick={() => onClose()} />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Account</label>
                <select
                  className={`form-select ${errors.account_id ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                  autoFocus
                  {...register("account_id")}
                >
                  <option value="">Select account…</option>
                  {accountOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.account_id && (
                  <div className="invalid-feedback">
                    {errors.account_id.message}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Supplier (optional)</label>
                <select
                  className="form-select"
                  {...register("supplier_id")}
                >
                  <option value="">None</option>
                  {supplierOptions.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label d-block">Side</label>
                <div className="btn-group" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    id="line-side-debit"
                    value="debit"
                    {...register("side")}
                  />
                  <label className="btn btn-outline-primary" htmlFor="line-side-debit">
                    Debit
                  </label>
                  <input
                    type="radio"
                    className="btn-check"
                    id="line-side-credit"
                    value="credit"
                    {...register("side")}
                  />
                  <label className="btn btn-outline-primary" htmlFor="line-side-credit">
                    Credit
                  </label>
                </div>
                {errors.side && (
                  <div className="text-danger small mt-1">{errors.side.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className={`form-control ${errors.amount ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                  {...register("amount")}
                />
                {errors.amount && (
                  <div className="invalid-feedback">{errors.amount.message}</div>
                )}
              </div>
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
                title="Save Line"
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
