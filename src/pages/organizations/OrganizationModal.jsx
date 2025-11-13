// src/pages/organizations/OrganizationModal.jsx
import React, { useEffect, useState } from 'react';
import { Modal } from 'bootstrap';
import { validateOrganization } from '../../utils/validation';
import { ORG_API } from './apiConfig';   // <-- ADD THIS

export default function OrganizationModal({ organization, onSave }) {
  const initialForm = { name: '', description: '', type: 'family' };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name || '',
        description: organization.description || '',
        type: organization.type || 'family',
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
    setIsDirty(false);
  }, [organization]);

  useEffect(() => {
    const { isValid, errors } = validateOrganization(form);
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
    const { isValid } = validateOrganization(form);
    if (!isValid) return;

    setIsSaving(true);

    // ✅ FIX: Use ORG_API configuration instead of hardcoded /api endpoints
    const method = organization ? 'PUT' : 'POST';
    const url = organization
      ? ORG_API.DETAIL(organization.id)
      : ORG_API.LIST;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');

      const modalEl = document.getElementById('organizationModal');
      const modal = Modal.getInstance(modalEl);
      modal.hide();

      setForm(initialForm);
      setIsDirty(false);
      onSave();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (e) => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Discard them?'
      );
      if (!confirmDiscard) {
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
    const modalEl = document.getElementById('organizationModal');
    const resetOnHide = () => {
      setForm(initialForm);
      setErrors({});
      setIsValid(false);
      setIsDirty(false);
    };
    modalEl.addEventListener('hidden.bs.modal', resetOnHide);
    return () => modalEl.removeEventListener('hidden.bs.modal', resetOnHide);
  }, []);

  return (
    <div
      className="modal fade"
      id="organizationModal"
      tabIndex="-1"
      aria-labelledby="organizationModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title" id="organizationModalLabel">
              {organization ? 'Edit Organization' : 'New Organization'}
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

              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <div className="invalid-feedback">{errors.name}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className={`form-control ${
                    errors.description ? 'is-invalid' : ''
                  }`}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
                {errors.description && (
                  <div className="invalid-feedback">{errors.description}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="family">Family</option>
                  <option value="business">Business</option>
                  <option value="charity">Charity</option>
                </select>
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
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
