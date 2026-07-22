import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  entrySchema,
  entryToFormValues,
  formValuesToEntryPayload,
} from "../../utils/validation/entrySchema";
import {
  createEntry,
  updateEntry,
} from "./eventsApi";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function EntryModal({
  isOpen,
  onClose,
  mode,
  entry,
  entryGroupId,
  displayOrder,
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
    resolver: zodResolver(entrySchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: entryToFormValues(null),
  });

  useEscapeToClose(isOpen, () => onClose());

  useEffect(() => {
    if (isOpen) {
      reset(entryToFormValues(entry));
    }
  }, [isOpen, entry, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = formValuesToEntryPayload(data, {
        displayOrder: isEdit ? entry.display_order : displayOrder,
        isPosted: isEdit ? entry.is_posted : false,
      });

      if (isEdit) {
        await updateEntry(selectedOrganizationId, entry.id, payload);
      } else {
        await createEntry(selectedOrganizationId, entryGroupId, payload);
      }

      onClose(true);
    } catch (err) {
      console.error("Save failed", err);
      await alert({
        title: "Save failed",
        message: err.message ?? "Error saving entry.",
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
                {isEdit ? "Edit Entry" : "Add Entry"}
              </h5>
              <button type="button" className="btn-close" onClick={() => onClose()} />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className={`form-control ${errors.date ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                  autoFocus
                  {...register("date")}
                />
                {errors.date && (
                  <div className="invalid-feedback">{errors.date.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <input
                  className={`form-control ${errors.description ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                  {...register("description")}
                />
                {errors.description && (
                  <div className="invalid-feedback">
                    {errors.description.message}
                  </div>
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
                title="Save Entry"
                disabled={!isDirty || !isValid || isSubmitting}
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
