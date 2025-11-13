// src/pages/organizations/OrganizationsList.jsx
import React, { useEffect, useState } from 'react';
import { Modal } from 'bootstrap';
import OrganizationModal from './OrganizationModal';
import { ORG_API } from './apiConfig';
import './organizations.css';

console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_URL);
console.log("ORG API", ORG_API)


export default function OrganizationsList() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(ORG_API.LIST);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setOrganizations(data);
    } catch (err) {
      console.error('Error loading organizations:', err);
    }
  };

  const handleSave = async () => {
    await fetchOrganizations();
    setSelectedOrg(null);
  };

  const openModal = (org = null) => {
    setSelectedOrg(org);
    const modal = new Modal(document.getElementById('organizationModal'));
    modal.show();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) return;
    try {
      const res = await fetch(ORG_API.DETAIL(id), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchOrganizations();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    // <main id="main" className="main">
    <>
      <div className="pagetitle d-flex justify-content-between align-items-center mb-3">
        <h1>Organizations</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <i className="bi bi-plus-lg me-2"></i>New Organization
        </button>
      </div>

      <section className="section">
        <div className="card">
          <div className="card-body">
            <table className="table table-hover table-striped align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Members</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td>{org.name}</td>
                    <td>{org.description}</td>
                    <td className="text-capitalize">{org.type}</td>
                    <td>{org.persons?.map(p => p.name).join(', ') || '-'}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => openModal(org)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(org.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {organizations.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-3 text-muted">
                      No organizations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <OrganizationModal organization={selectedOrg} onSave={handleSave} />
    </>
    // </main>
  );
}
