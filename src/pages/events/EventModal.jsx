import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EVENT_TYPES,
  eventSchema,
  eventToFormValues,
  formValuesToCreatePayload,
  formValuesToUpdatePayload,
} from "../../utils/validation/eventSchema";
import { createEvent, updateEvent } from "./eventsApi";
import { formatEventType } from "./eventUtils";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function EventModal({
  isOpen,
  onClose,
  mode = "add",
  event,
  onCreated,
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
    resolver: zodResolver(eventSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: eventToFormValues(null),
  });

  useEscapeToClose(isOpen, () => onClose(false));

  useEffect(() => {
    if (isOpen) {
      reset(eventToFormValues(isEdit ? event : null));
    }
  }, [isOpen, isEdit, event, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        const payload = formValuesToUpdatePayload(data, event);
        await updateEvent(selectedOrganizationId, event.id, payload);
        onClose(true);
      } else {
        const payload = formValuesToCreatePayload(data);
        const created = await createEvent(selectedOrganizationId, payload);
        onClose(true);
        onCreated?.(created);
      }
    } catch (err) {
      console.error("Save failed", err);
      await alert({
        title: isEdit ? "Update failed" : "Create failed",
        message: err.message ?? `Error ${isEdit ? "updating" : "creating"} event.`,
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
                    {isEdit ? "Edit Event" : "Add New Event"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => onClose(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="event-description">
                      Description
                    </label>
                    <input
                      id="event-description"
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

                  <div className="mb-3">
                    <label className="form-label" htmlFor="event-type">
                      Type
                    </label>
                    <select
                      id="event-type"
                      className={`form-select ${errors.type ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                      {...register("type")}
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {formatEventType(type)}
                        </option>
                      ))}
                    </select>
                    {errors.type && (
                      <div className="invalid-feedback">
                        {errors.type.message}
                      </div>
                    )}
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="event-is-external"
                      {...register("is_external")}
                    />
                    <label className="form-check-label" htmlFor="event-is-external">
                      External event (involves outside parties)
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary bi-x-circle"
                    title="Cancel"
                    onClick={() => onClose(false)}
                  ></button>
                  <button
                    type="submit"
                    className="btn btn-primary bi-save"
                    title={isEdit ? "Save Event" : "Create Event"}
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
