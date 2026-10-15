import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LINKABLE_RESOURCE_TYPES,
  lineResourceSchema,
  lineResourceToFormValues,
  formValuesToLineResourcePayload,
  computeLineResourceExtendedAmount,
} from "../../utils/validation/lineResourceSchema";
import { formatResourceType } from "../../utils/validation/resourceSchema";
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
    defaultValues: lineResourceToFormValues(resource, defaults),
  });

  useEscapeToClose(isOpen, () => onClose());

  useEffect(() => {
    if (!isOpen) return;
    const values = lineResourceToFormValues(resource, defaults);
    reset(values);

    // If stored extended was saved with the old abs() formula, mark dirty so
    // Save is enabled and can persist the sign-corrected amount.
    if (resource != null) {
      const computed = computeLineResourceExtendedAmount(
        values.quantity,
        values.unit_amount
      );
      const stored = Number(resource.extended_amount);
      if (
        computed != null &&
        Number.isFinite(stored) &&
        Math.abs(computed - stored) >= 0.005
      ) {
        setValue("unit_amount", values.unit_amount, { shouldDirty: true });
      }
    }
  }, [isOpen, resource, defaults, reset, setValue]);

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
  const resourceType = watch("resource_type");
  const selectedResourceId = watch("resource_id");
  const quantity = watch("quantity");
  const unitAmount = watch("unit_amount");

  // When editing a linked line, sync type from the catalog record.
  useEffect(() => {
    if (!isOpen || !linkToResource) return;
    if (selectedResourceId == null || selectedResourceId === "") return;

    const selected = catalogResources.find(
      (item) => item.id === Number(selectedResourceId)
    );
    if (
      selected &&
      LINKABLE_RESOURCE_TYPES.includes(selected.type) &&
      selected.type !== resourceType
    ) {
      setValue("resource_type", selected.type, { shouldDirty: false });
    }
  }, [
    isOpen,
    linkToResource,
    selectedResourceId,
    catalogResources,
    resourceType,
    setValue,
  ]);

  const catalogOptions = useMemo(() => {
    const matching = catalogResources.filter(
      (item) => item.type === resourceType && item.is_active
    );
    const selectedId =
      selectedResourceId != null && selectedResourceId !== ""
        ? Number(selectedResourceId)
        : null;
    let options = matching;

    if (selectedId != null) {
      const selected = catalogResources.find((item) => item.id === selectedId);
      if (selected && !matching.some((item) => item.id === selectedId)) {
        options = [selected, ...matching];
      }
    }

    return [...options].sort((a, b) =>
      String(a.name ?? "").localeCompare(String(b.name ?? ""))
    );
  }, [catalogResources, selectedResourceId, resourceType]);

  const populateFromCatalog = (catalogId) => {
    if (catalogId == null || catalogId === "") return;
    const selected = catalogResources.find(
      (item) => item.id === Number(catalogId)
    );
    if (!selected) return;

    setValue("description", selected.name ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    // Items may supply default units; services/instruments do not.
    setValue(
      "unit_measure",
      selected.type === "ITEM" ? (selected.item?.default_units ?? "") : "",
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const handleResourceTypeChange = (e) => {
    const nextType = e.target.value;
    setValue("resource_type", nextType, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("resource_id", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const extendedPreview = useMemo(() => {
    const computed = computeLineResourceExtendedAmount(quantity, unitAmount);
    if (
      computed == null ||
      Number(quantity) === 0 ||
      Number(unitAmount) === 0
    ) {
      return null;
    }
    return computed;
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
                          value={resourceType}
                          onChange={handleResourceTypeChange}
                        >
                          {LINKABLE_RESOURCE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {formatResourceType(type)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-sm-8">
                        <label
                          className="form-label"
                          htmlFor="line-resource-catalog"
                        >
                          {formatResourceType(resourceType) || "Resource"}
                        </label>
                        <select
                          id="line-resource-catalog"
                          className={`form-select ${errors.resource_id ? "is-invalid" : ""}`}
                          disabled={catalogLoading}
                          value={
                            selectedResourceId == null || selectedResourceId === ""
                              ? ""
                              : String(selectedResourceId)
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            setValue("resource_id", raw, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            populateFromCatalog(raw);
                          }}
                        >
                          <option value="">
                            {catalogLoading
                              ? "Loading…"
                              : `Select a ${formatResourceType(resourceType).toLowerCase() || "resource"}…`}
                          </option>
                          {catalogOptions.map((item) => (
                            <option key={item.id} value={String(item.id)}>
                              {item.type === "INSTRUMENT" && item.instrument?.symbol
                                ? `${item.instrument.symbol} — ${item.name}`
                                : item.name}
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
                        step="0.0001"
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
