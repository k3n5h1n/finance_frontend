import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  entryGroupSchema,
  entryGroupToFormValues,
  entryGroupCreateDefaults,
  entryGroupHasStoredType,
  formValuesToEntryGroupPayload,
  formValuesToCreateEntryGroupPayload,
  ENTRY_GROUP_TYPES,
} from "../../utils/validation/entryGroupSchema";
import { createEntryGroup, updateEntryGroup } from "./eventsApi";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";
import { formatEntryGroupType } from "./eventUtils";

export default function EntryGroupModal({
  isOpen,
  onClose,
  mode = "edit",
  entryGroup,
  eventId,
  displayOrder,
  hasPrimaryGroup = false,
}) {
  const { selectedOrganizationId } = useOrganization();
  const { alert, dialogProps, Dialog } = useAppDialog();
  const isEdit = mode === "edit";
  const missingStoredType = isEdit && !entryGroupHasStoredType(entryGroup);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(entryGroupSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: entryGroupCreateDefaults(),
  });

  useEscapeToClose(isOpen, () => onClose(false));

  useEffect(() => {
    if (isOpen) {
      reset(
        isEdit
          ? entryGroupToFormValues(entryGroup)
          : entryGroupCreateDefaults({ hasPrimary: hasPrimaryGroup })
      );
    }
  }, [isOpen, isEdit, entryGroup, hasPrimaryGroup, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        const payload = formValuesToEntryGroupPayload(data, entryGroup);
        await updateEntryGroup(selectedOrganizationId, entryGroup.id, payload);
      } else {
        const payload = formValuesToCreateEntryGroupPayload(data, displayOrder);
        await createEntryGroup(selectedOrganizationId, eventId, payload);
      }
      onClose(true);
    } catch (err) {
      console.error("Save failed", err);
      await alert({
        title: isEdit ? "Update failed" : "Create failed",
        message:
          err.message ??
          `Error ${isEdit ? "updating" : "creating"} entry group.`,
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
                    {isEdit ? "Edit Entry Group" : "Add Entry Group"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => onClose(false)}
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

                  <div className="mb-0">
                    <label className="form-label" htmlFor="entry-group-type">
                      Type
                    </label>
                    <select
                      id="entry-group-type"
                      className={`form-select ${errors.type ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                      {...register("type")}
                    >
                      {ENTRY_GROUP_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {formatEntryGroupType(type)}
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
                    title="Cancel"
                    onClick={() => onClose(false)}
                  ></button>
                  <button
                    type="submit"
                    className="btn btn-primary bi-save"
                    title={isEdit ? "Save Entry Group" : "Create Entry Group"}
                    disabled={
                      (!isEdit && !isValid) ||
                      (isEdit && !isDirty && !missingStoredType) ||
                      isSubmitting
                    }
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
