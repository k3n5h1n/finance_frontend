// src/components/PeopleList.jsx

import { useState, useEffect } from "react";
import PeopleModal from "./PeopleModal";
import { PEOPLE_API } from "./apiConfig";
import { deletePerson } from "./peopleApi";

export default function PeopleList() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalMode, setModalMode] = useState("edit"); // "add" | "edit" | "view"

  /** Load all people */
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

  // Called once, on page load
  useEffect(() => {
    fetchPeople();
  }, []);

  const openViewModal = (person) => {
    setSelectedPerson(person);
    setModalMode("view");
    setIsModalOpen(true);
  };

  // Open modal for new person 
  const openNewModal = () => {
    setSelectedPerson(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  // Open modal for editing a person
  const openEditModal = (person) => {
    setSelectedPerson(person);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // Open modal with copy of person to add
  const openCopyModal = (person) => {
    const copy = {
      ...person,
      id: undefined,
      name: `${person.name} (copy)`
    };
  
    setModalMode("add");
    setSelectedPerson(copy);
    setIsModalOpen(true);
  };
  
  // Delete a person from the list
  const handleDelete = async (id) => {
    await deletePerson(id);
    fetchPeople();
  };

  /** When modal closes */
  const closeModal = (refresh) => {
    setIsModalOpen(false);

    if (refresh) fetchPeople();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <h3>People</h3>
        <button className="btn btn-primary" onClick={openNewModal}>
          Add Person
        </button>
      </div>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Birth Year</th>
            <th className="text-end" style={{ width: "1%" }}></th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.birth_year ?? "—"}</td>
              <td className="text-end">
                <div className="d-flex flex-nowrap justify-content-end gap-1">
                  <button
                    className="btn btn-sm btn-secondary bi-eye"
                    data-bs-toggle="tooltip"
                    title="View Person"
                    onClick={() => openViewModal(p)}
                  ></button>
                  <button
                    className="btn btn-sm btn-secondary bi-pencil"
                    data-bs-toggle="tooltip"
                    title="Edit Person"
                    onClick={() => openEditModal(p)}
                  ></button>
                  <button
                    className="btn btn-sm btn-secondary bi-copy"
                    data-bs-toggle="tooltip"
                    title="Copy Person"
                    onClick={() => openCopyModal(p)}
                  ></button>
                  <button
                    className="btn btn-sm btn-danger bi-trash"
                    data-bs-toggle="tooltip"
                    title="Delete Person"
                    onClick={() => handleDelete(p.id)}
                  ></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PeopleModal
        isOpen={isModalOpen}
        onClose={closeModal}
        person={selectedPerson}
        mode={modalMode}
      />
    </>
  );
}
