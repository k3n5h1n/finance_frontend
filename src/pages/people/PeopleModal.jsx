// src/components/PeopleModal.jsx

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personSchema } from "../../utils/validation/personSchema";
import { createPerson, updatePerson, deletePerson } from "./peopleApi";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

export default function PeopleModal({ isOpen, onClose, person, mode}) {
  // const isEdit = Boolean(person?.id);
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const isAdd = mode === "add";
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    resolver: zodResolver(personSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      birth_year: "",
    },
  });

  useEscapeToClose(isOpen, () => onClose(false));

  /** Populate form for editing or clear for new person */
  useEffect(() => {
    reset({
      name: person?.name ?? "",
      birth_year: person?.birth_year ?? "",
    });
  }, [person, reset]);

  /** If modal not open, render nothing */
  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updatePerson(person.id, data);
      } else {
        await createPerson(data);
      }
      onClose(true); // success
    } catch (err) {
      console.error("Save failed", err);
      alert("Error saving person.");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePerson(person.id);
      onClose(true); // success
    } catch (err) {
      console.error("Deletion failed", err);
      alert("Error deleting person.");
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" aria-modal="true" role="dialog">
      <div className="modal-dialog">
        <div className="modal-content">

          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                {isEdit ? "Edit Person" : isAdd ? "Add New Person": "View Person"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => onClose(false)}
              />
            </div>

            {/* Body */}
            <div className="modal-body">
              
              {/* Name */}
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

              {/* Birth Year */}
              <div className="mb-3">
                <label className="form-label">Birth Year (optional)</label>
                <input
                  className={`form-control ${errors.birth_year ? "is-invalid" : isDirty ? "is-valid" : ""}`}
                  disabled={isView}
                  {...register("birth_year")}
                />
                {errors.birth_year && (
                  <div className="invalid-feedback">{errors.birth_year.message}</div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary bi-x-circle"
                data-bs-toggle="tooltip"
                title="Cancel" 
                onClick={() => onClose(false)}
              ></button>
              {!isView && person?.id && (
                <button
                  type="button"
                  className="btn btn-danger me-auto bi-trash"
                  data-bs-toggle="tooltip"
                  title="Delete Person" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                ></button>
              )}
              {!isView && (
                <button 
                  type="submit" 
                  className="btn btn-primary bi-save"
                  data-bs-toggle="tooltip"
                  title={isEdit ? "Save Changes" : "Create Person"}
                  disabled={!isDirty || !isValid || isSubmitting}
                >
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
