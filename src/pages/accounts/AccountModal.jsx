import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ACCOUNT_TYPES,
  accountSchema,
  accountToFormValues,
  formValuesToPayload,
} from "../../utils/validation/accountSchema";
import { createAccount, updateAccount, deleteAccount } from "./accountsApi";
import { getDescendantIds, flattenAccountTreeForSelect } from "./accountTree";
import { useOrganization } from "../../context/OrganizationContext";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function AccountModal({
  isOpen,
  onClose,
  account,
  mode,
  accounts = [],
  organizations = [],
}) {
  const { selectedOrganizationId } = useOrganization();
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const isAdd = mode === "add";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(accountSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: accountToFormValues(null, selectedOrganizationId),
  });

  useEscapeToClose(isOpen, () => onClose(false));

  useEffect(() => {
    if (!isOpen) return;
    const defaultOrganizationId = isAdd ? selectedOrganizationId : undefined;
    reset(accountToFormValues(account, defaultOrganizationId));
  }, [account, isOpen, isAdd, selectedOrganizationId, reset]);

  const parentOptions = useMemo(() => {
    const blockedParentIds = new Set();
    if (account?.id != null) {
      blockedParentIds.add(account.id);
      getDescendantIds(account.id, accounts).forEach((id) =>
        blockedParentIds.add(id)
      );
    }

    return flattenAccountTreeForSelect(accounts, blockedParentIds);
  }, [accounts, account?.id]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      const payload = formValuesToPayload(data);
      if (isEdit) {
        await updateAccount(selectedOrganizationId, account.id, payload);
      } else {
        await createAccount(selectedOrganizationId, payload);
      }
      onClose(true);
    } catch (err) {
      console.error("Save failed", err);
      alert(err.message ?? "Error saving account.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(selectedOrganizationId, account.id);
      onClose(true);
    } catch (err) {
      console.error("Deletion failed", err);
      alert("Error deleting account.");
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-header">
              <h5 className="modal-title">
                {isEdit
                  ? "Edit Account"
                  : isAdd
                    ? "Add New Account"
                    : "View Account"}
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

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Type</label>
                  <select
                    className={`form-select ${errors.type ? "is-invalid" : ""}`}
                    disabled={isView}
                    {...register("type")}
                  >
                    {ACCOUNT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <div className="invalid-feedback">{errors.type.message}</div>
                  )}
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">Currency</label>
                  <input
                    className={`form-control ${errors.currency ? "is-invalid" : ""}`}
                    disabled={isView}
                    {...register("currency")}
                  />
                  {errors.currency && (
                    <div className="invalid-feedback">
                      {errors.currency.message}
                    </div>
                  )}
                </div>

                <div className="col-md-4 mb-3 d-flex align-items-end">
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      disabled={isView}
                      {...register("active")}
                    />
                    <label className="form-check-label">Active</label>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Organization</label>
                  <select
                    className={`form-select ${errors.organization_id ? "is-invalid" : ""}`}
                    disabled={isView}
                    {...register("organization_id")}
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  {errors.organization_id && (
                    <div className="invalid-feedback">
                      {errors.organization_id.message}
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Parent Account</label>
                  <select
                    className="form-select"
                    disabled={isView}
                    {...register("parent_id")}
                  >
                    <option value="">None (top level)</option>
                    {parentOptions.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary bi-x-circle"
                data-bs-toggle="tooltip"
                title="Cancel"
                onClick={() => onClose(false)}
              ></button>
              {!isView && account?.id != null && (
                <button
                  type="button"
                  className="btn btn-danger me-auto bi-trash"
                  data-bs-toggle="tooltip"
                  title="Delete Account"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                ></button>
              )}
              {!isView && (
                <button
                  type="submit"
                  className="btn btn-primary bi-save"
                  data-bs-toggle="tooltip"
                  title={isEdit ? "Save Changes" : "Create Account"}
                  disabled={!isDirty || !isValid || isSubmitting}
                ></button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
