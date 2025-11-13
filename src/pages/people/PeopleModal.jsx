// src/pages/people/peopleModal.jsx

import React, { useEffect, useState } from "react";
import { Modal } from "bootstrap";
import { validatePerson } from "../../utils/validation";
import { PEOPLE_API } from "./apiConfig";

export default function PeopleModal({ person, onSave }) {
  const initialForm = { name: "", birth_year: "" };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (person) {
      setForm({
        name: person.name || "",
        birth_year: person.birth_year ?? "",
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
    setIsDirty(false);
  }, [person]);

  useEffect(() => {
    const { isValid, errors } = validatePerson(form);
    setIsValid(isValid);
    setErrors(errors);
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid } = validatePerson(form);
    if (!isValid) return;

    setIsSaving(true);

    const method = person ? "PUT" : "POST";
    const url = person ? PEOPLE_API.DETAIL(person.id) : PEOPLE_API.LIST;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          birth_year:
            form.birth_year === "" ? null : Number(form.birth_year),
        }),
      });

      if (!res.ok) throw new Error("Failed to save person");

      const modal = Modal.getInstance(document.getElementById("peopleModal"));
      modal.hide();

      setForm(initialForm);
      setIsDirty(false);
      onSave();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (e) => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them?"
      );
      if (!confirmed) {
        e.preventDefault();
        return;
      }
    }
    setForm(initialForm);
    setErrors({});
    setIsValid(false);
    setIsDirty(false);
  };

  useEffect(() => {
    const el = document.getElementById("peopleModal");
    const reset = () => {
      setForm(initialForm);
      setErrors({});
      setIsValid(false);
      setIsDirty(false);
    };
    el.addEventListener("hidden.bs.modal", reset);
    return () => el.removeEventListener("hidden.bs.modal", reset);
  }, []);

  return (
    <div
      className="modal fade"
      id="peopleModal"
      tabIndex="-1"
      aria-labelledby="peopleModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="peopleModalLabel">
              {person ? "Edit Person" : "New Person"}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={handleCancel}
            ></button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {/* Name */}
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  name="name"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name}</div>
                )}
              </div>

              {/* Birth year */}
              <div className="mb-3">
                <label className="form-label">Birth Year</label>
                <input
                  type="number"
                  name="birth_year"
                  className={`form-control ${
                    errors.birth_year ? "is-invalid" : ""
                  }`}
                  value={form.birth_year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                />
                {errors.birth_year && (
                  <div className="invalid-feedback">{errors.birth_year}</div>
                )}
                <div className="form-text">
                  Leave blank if unknown.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isValid || isSaving}
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
