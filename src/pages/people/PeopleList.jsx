// src/pages/people/peopleList.jsx

import React, { useEffect, useState } from "react";
import "./people.css";
import { Modal } from 'bootstrap';
import { PEOPLE_API } from "./apiConfig";
import PeopleModal from "./PeopleModal";

export default function PeopleList() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const fetchPeople = async () => {
    try {
      const res = await fetch(PEOPLE_API.LIST);
      const data = await res.json();
      setPeople(data);
    } catch (err) {
      console.error("Failed to fetch people:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const openNewModal = () => {
    setSelectedPerson(null);
    const modal = new Modal(document.getElementById("peopleModal"));
    modal.show();
  };

  const openEditModal = (person) => {
    setSelectedPerson(person);
    const modal = new Modal(document.getElementById("peopleModal"));
    modal.show();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this person?")) return;
    try {
      const res = await fetch(PEOPLE_API.DETAIL(id), { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchPeople();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="container py-4 people-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>People</h2>
        <button className="btn btn-primary" onClick={openNewModal}>
          + New Person
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Birth Year</th>
              <th style={{ width: "140px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.birth_year ?? "—"}</td>
                <td>
                  <button
                    className="btn btn-sm btn-secondary me-2"
                    onClick={() => openEditModal(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {people.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-3">
                  No people found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <PeopleModal person={selectedPerson} onSave={fetchPeople} />
    </div>
  );
}
