import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RESOURCE_TYPES,
  INSTRUMENT_TYPES,
  INSTRUMENT_CURRENCIES,
  resourceSchema,
  resourceToFormValues,
  formValuesToResourcePayload,
  formatResourceType,
  formatInstrumentType,
} from "../../utils/validation/resourceSchema";
import {
  createResource,
  updateResource,
  deleteResource,
} from "./resourcesApi";
import { useOrganization } from "../../context/OrganizationContext";
import { useAppDialog } from "../../hooks/useAppDialog";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";
import "./resources.css";

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
    control,
    setValue,
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

  const selectedType = useWatch({ control, name: "type", defaultValue: "ITEM" });
  const isItemType = selectedType === "ITEM";
  const isInstrumentType = selectedType === "INSTRUMENT";

  const typeRegister = register("type");

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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex="-1"
        aria-modal="true"
        role="dialog"
      >
        <div
          className={`modal-dialog modal-dialog-scrollable resource-modal-dialog${
            isInstrumentType ? " modal-lg" : ""
          }`}
        >
          <div className="modal-content">
            <form className="resource-modal-form" onSubmit={handleSubmit(onSubmit)}>
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
                    disabled={isView || isEdit}
                    {...typeRegister}
                    value={selectedType ?? "ITEM"}
                    onChange={(e) => {
                      typeRegister.onChange(e);
                      setValue("type", e.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
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
                  {isEdit && (
                    <div className="form-text">
                      Resource type cannot be changed after create.
                    </div>
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

                {isInstrumentType && (
                  <fieldset className="border rounded p-3">
                    <legend className="float-none w-auto px-2 fs-6 mb-0">
                      Instrument details
                    </legend>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label
                          className="form-label"
                          htmlFor="instrument-symbol"
                        >
                          Symbol
                        </label>
                        <input
                          id="instrument-symbol"
                          className={`form-control ${errors.instrument_symbol ? "is-invalid" : ""}`}
                          placeholder="e.g. XIC.TO"
                          disabled={isView}
                          {...register("instrument_symbol")}
                        />
                        {errors.instrument_symbol && (
                          <div className="invalid-feedback">
                            {errors.instrument_symbol.message}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label
                          className="form-label"
                          htmlFor="instrument-type"
                        >
                          Instrument type
                        </label>
                        <select
                          id="instrument-type"
                          className={`form-select ${errors.instrument_type ? "is-invalid" : ""}`}
                          disabled={isView}
                          {...register("instrument_type")}
                        >
                          <option value="">Select…</option>
                          {INSTRUMENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {formatInstrumentType(type)}
                            </option>
                          ))}
                        </select>
                        {errors.instrument_type && (
                          <div className="invalid-feedback">
                            {errors.instrument_type.message}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label
                          className="form-label"
                          htmlFor="instrument-currency"
                        >
                          Currency
                        </label>
                        <select
                          id="instrument-currency"
                          className={`form-select ${errors.instrument_currency ? "is-invalid" : ""}`}
                          disabled={isView}
                          {...register("instrument_currency")}
                        >
                          {INSTRUMENT_CURRENCIES.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                        {errors.instrument_currency && (
                          <div className="invalid-feedback">
                            {errors.instrument_currency.message}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label
                          className="form-label"
                          htmlFor="instrument-market-api-id"
                        >
                          Market API ID
                        </label>
                        <input
                          id="instrument-market-api-id"
                          type="number"
                          step="1"
                          min="1"
                          className={`form-control ${errors.instrument_market_api_id ? "is-invalid" : ""}`}
                          disabled={isView}
                          {...register("instrument_market_api_id")}
                        />
                        {errors.instrument_market_api_id && (
                          <div className="invalid-feedback">
                            {errors.instrument_market_api_id.message}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label
                          className="form-label"
                          htmlFor="instrument-date-listed"
                        >
                          Date listed
                        </label>
                        <input
                          id="instrument-date-listed"
                          type="date"
                          className="form-control"
                          disabled={isView}
                          {...register("instrument_date_listed")}
                        />
                      </div>
                      <div className="col-md-4">
                        <label
                          className="form-label"
                          htmlFor="instrument-date-delisted"
                        >
                          Date delisted
                        </label>
                        <input
                          id="instrument-date-delisted"
                          type="date"
                          className={`form-control ${errors.instrument_date_delisted ? "is-invalid" : ""}`}
                          disabled={isView}
                          {...register("instrument_date_delisted")}
                        />
                        {errors.instrument_date_delisted && (
                          <div className="invalid-feedback">
                            {errors.instrument_date_delisted.message}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label
                          className="form-label"
                          htmlFor="instrument-isin"
                        >
                          ISIN
                        </label>
                        <input
                          id="instrument-isin"
                          className="form-control"
                          placeholder="e.g. CA46430J1012"
                          disabled={isView}
                          {...register("instrument_isin")}
                        />
                      </div>
                      <div className="col-md-6">
                        <label
                          className="form-label"
                          htmlFor="instrument-cusip"
                        >
                          CUSIP
                        </label>
                        <input
                          id="instrument-cusip"
                          className="form-control"
                          placeholder="e.g. 46430J101"
                          disabled={isView}
                          {...register("instrument_cusip")}
                        />
                      </div>
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
