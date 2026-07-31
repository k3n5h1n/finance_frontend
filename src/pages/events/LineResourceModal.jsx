import { useEffect, useMemo, useState, useRef } from "react";
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
import { listResources } from "../resources/resourcesApi";
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
  const [catalogResources, setCatalogResources] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const lastPopulatedResourceIdRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(lineResourceSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: lineResourceToFormValues(null, defaults),
  });

  useEscapeToClose(isOpen, () => onClose());

  useEffect(() => {
    if (!isOpen) return;
    reset(lineResourceToFormValues(resource, defaults));
    lastPopulatedResourceIdRef.current = resource?.resource_id ?? null;
  }, [isOpen, resource, defaults, reset]);

  useEffect(() => {
    if (!isOpen || selectedOrganizationId == null) return;

    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const data = await listResources(selectedOrganizationId);
        if (!cancelled) setCatalogResources(data);
      } catch (err) {
        console.error("Failed to load resources:", err);
        if (!cancelled) {
          setCatalogResources([]);
          setCatalogError(err.message ?? "Failed to load resources.");
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedOrganizationId]);

  const linkToResource = watch("link_to_resource");
  const selectedResourceId = watch("resource_id");
  const quantity = watch("quantity");
  const unitAmount = watch("unit_amount");

  const itemOptions = useMemo(() => {
    const activeItems = catalogResources.filter(
      (item) => item.type === "ITEM" && item.is_active
    );
    const selectedId = selectedResourceId != null ? Number(selectedResourceId) : null;
    if (selectedId == null) return activeItems;

    const selected = catalogResources.find((item) => item.id === selectedId);
    if (!selected) return activeItems;
    if (activeItems.some((item) => item.id === selectedId)) return activeItems;
    return [selected, ...activeItems];
  }, [catalogResources, selectedResourceId]);

  useEffect(() => {
    if (!isOpen || !linkToResource) return;
    if (selectedResourceId == null || selectedResourceId === "") return;

    const id = Number(selectedResourceId);
    if (lastPopulatedResourceIdRef.current === id) return;

    const selected = catalogResources.find((item) => item.id === id);
    if (!selected) return;

    setValue("description", selected.name ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("unit_measure", selected.item?.default_units ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    lastPopulatedResourceIdRef.current = id;
  }, [
    isOpen,
    linkToResource,
    selectedResourceId,
    catalogResources,
    setValue,
  ]);

  const extendedPreview = useMemo(() => {
    const qty = Number(quantity);
    const unit = Number(unitAmount);
    if (!Number.isFinite(qty) || !Number.isFinite(unit) || qty === 0 || unit === 0) {
      return null;
    }
    return Math.round(Math.abs(qty * unit) * 100) / 100;
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
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="line-resource-link"
                      {...register("link_to_resource")}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="line-resource-link"
                    >
                      Link to catalog resource
                    </label>
                  </div>

                  {linkToResource && (
                    <div className="row g-3 mb-3">
                      <div className="col-sm-4">
                        <label
                          className="form-label"
                          htmlFor="line-resource-type"
                        >
                          Resource type
                        </label>
                        <select
                          id="line-resource-type"
                          className="form-select"
                          disabled
                          {...register("resource_type")}
                        >
                          <option value="ITEM">Item</option>
                        </select>
                        <div className="form-text">
                          Only Item is supported for now.
                        </div>
                      </div>
                      <div className="col-sm-8">
                        <label
                          className="form-label"
                          htmlFor="line-resource-catalog"
                        >
                          Item
                        </label>
                        <select
                          id="line-resource-catalog"
                          className={`form-select ${errors.resource_id ? "is-invalid" : ""}`}
                          disabled={catalogLoading}
                          {...register("resource_id")}
                        >
                          <option value="">
                            {catalogLoading
                              ? "Loading…"
                              : "Select an item…"}
                          </option>
                          {itemOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                              {item.is_active === false ? " (inactive)" : ""}
                            </option>
                          ))}
                        </select>
                        {errors.resource_id && (
                          <div className="invalid-feedback">
                            {errors.resource_id.message}
                          </div>
                        )}
                        {catalogError && (
                          <div className="text-danger small mt-1">
                            {catalogError}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label" htmlFor="line-resource-description">
                      Description
                    </label>
                    <input
                      id="line-resource-description"
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
                      <label className="form-label" htmlFor="line-resource-quantity">
                        Quantity
                      </label>
                      <input
                        id="line-resource-quantity"
                        type="number"
                        step="any"
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
                      <label className="form-label" htmlFor="line-resource-unit">
                        Unit
                      </label>
                      <input
                        id="line-resource-unit"
                        className="form-control"
                        placeholder="e.g. unit, mL"
                        {...register("unit_measure")}
                      />
                    </div>

                    <div className="col-sm-4">
                      <label className="form-label" htmlFor="line-resource-unit-cost">
                        Unit Cost
                      </label>
                      <input
                        id="line-resource-unit-cost"
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
