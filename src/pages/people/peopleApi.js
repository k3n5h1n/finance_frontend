// src/pages/people/peopleApi.js
import { PEOPLE_API } from "./apiConfig";

export async function listPeople() {
  const res = await fetch(PEOPLE_API.LIST);
  if (!res.ok) throw new Error("Failed to load people");
  return res.json();
}

export async function getPerson(id) {
  const res = await fetch(PEOPLE_API.DETAIL(id));
  if (!res.ok) throw new Error("Failed to load person");
  return res.json();
}

export async function createPerson(data) {
  const res = await fetch(PEOPLE_API.LIST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create person");
  return res.json();
}

export async function updatePerson(id, data) {
  const res = await fetch(PEOPLE_API.DETAIL(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update person");
  return res.json();
}

export async function deletePerson(id) {
  if (!confirm("Delete this person?")) return;

  const res = await fetch(PEOPLE_API.DETAIL(id), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete person");
}
